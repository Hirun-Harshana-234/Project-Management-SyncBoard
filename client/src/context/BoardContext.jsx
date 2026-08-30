import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { api, getAccessToken, refreshSession } from "../services/api";
import { enqueue, getBoardCache, getQueue, replaceQueue, saveBoardCache } from "../services/offlineStore";

const BoardContext = createContext(null);
const initialState = {
  boards: [], board: null, tasks: [], activities: [], onlineUserIds: [], loading: true,
  isOffline: !navigator.onLine, pendingCount: getQueue().length, conflict: null, notice: null
};

function mergeById(items, nextItem) {
  const index = items.findIndex((item) => item.id === nextItem.id);
  if (index < 0) return [nextItem, ...items];
  const copy = [...items];
  copy[index] = nextItem;
  return copy;
}

export function boardReducer(state, action) {
  switch (action.type) {
    case "reset": return { ...initialState, loading: false, isOffline: !navigator.onLine, pendingCount: getQueue().length };
    case "loading": return { ...state, loading: true, notice: null };
    case "boardsLoaded": return { ...state, boards: action.boards, loading: false };
    case "boardLoaded": return { ...state, board: action.board, tasks: action.tasks, activities: action.activities || [], loading: false, isOffline: false };
    case "cachedBoardLoaded": return { ...state, ...action.payload, loading: false, isOffline: true, notice: "Showing the latest saved copy while you are offline." };
    case "boardUpserted": return { ...state, boards: mergeById(state.boards, action.board), board: state.board?.id === action.board.id ? action.board : state.board };
    case "boardRemoved": return { ...state, boards: state.boards.filter((item) => item.id !== action.boardId), board: state.board?.id === action.boardId ? null : state.board };
    case "taskUpserted": return { ...state, tasks: mergeById(state.tasks.filter((item) => !action.task.clientId || item.clientId !== action.task.clientId || item.id === action.task.id), action.task) };
    case "taskRemoved": return { ...state, tasks: state.tasks.filter((item) => item.id !== action.taskId) };
    case "activityAdded": return { ...state, activities: [action.activity, ...state.activities.filter((item) => item._id !== action.activity._id)].slice(0, 50) };
    case "presence": return action.boardId === state.board?.id ? { ...state, onlineUserIds: action.onlineUserIds } : state;
    case "offline": return { ...state, isOffline: true, notice: "You are offline. New changes will sync automatically when the connection returns." };
    case "online": return { ...state, isOffline: false, notice: action.notice ?? null };
    case "pending": return { ...state, pendingCount: action.count };
    case "conflict": return { ...state, conflict: action.conflict, notice: "A teammate changed this task before your update reached the server." };
    case "clearConflict": return { ...state, conflict: null, notice: null };
    case "notice": return { ...state, notice: action.message };
    default: return state;
  }
}

export function BoardProvider({ children }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(boardReducer, initialState);
  const stateRef = useRef(state);
  const socketRef = useRef(null);
  stateRef.current = state;

  const loadBoards = useCallback(async () => {
    if (!user) return;
    dispatch({ type: "loading" });
    try {
      const data = await api.get("/boards");
      dispatch({ type: "boardsLoaded", boards: data.boards });
      const remembered = localStorage.getItem("pms:activeBoard");
      const target = data.boards.find((board) => board.id === remembered) || data.boards[0];
      if (target) await loadBoard(target.id);
    } catch (error) {
      dispatch({ type: "notice", message: error.message });
      dispatch({ type: "boardsLoaded", boards: [] });
    }
  }, [user]);

  const loadBoard = useCallback(async (boardId) => {
    if (!boardId) return;
    localStorage.setItem("pms:activeBoard", boardId);
    try {
      const data = await api.get(`/boards/${boardId}`);
      saveBoardCache(boardId, data);
      dispatch({ type: "boardLoaded", ...data });
      socketRef.current?.emit("board:join", boardId);
    } catch (error) {
      const cache = getBoardCache(boardId);
      if (error.isNetworkError && cache) dispatch({ type: "cachedBoardLoaded", payload: cache });
      else dispatch({ type: "notice", message: error.message });
    }
  }, []);

  useEffect(() => {
    if (user) loadBoards();
    else dispatch({ type: "reset" });
  }, [user, loadBoards]);

  useEffect(() => {
    if (!user) return undefined;
    const socket = io({ auth: { token: getAccessToken() }, withCredentials: true });
    socketRef.current = socket;
    socket.on("connect", () => {
      if (stateRef.current.board?.id) socket.emit("board:join", stateRef.current.board.id);
    });
    socket.io.on("reconnect_attempt", () => { socket.auth.token = getAccessToken(); });
    socket.on("connect_error", async (error) => {
      if (error.message === "Unauthorized") {
        try {
          await refreshSession();
          socket.auth.token = getAccessToken();
          socket.connect();
          return;
        } catch { /* Authentication state will be restored by the normal sign-in flow. */ }
      }
      dispatch({ type: "offline" });
    });
    socket.on("board:created", ({ board }) => dispatch({ type: "boardUpserted", board }));
    socket.on("board:updated", ({ board }) => dispatch({ type: "boardUpserted", board }));
    socket.on("board:deleted", ({ boardId }) => dispatch({ type: "boardRemoved", boardId }));
    socket.on("task:created", ({ task }) => dispatch({ type: "taskUpserted", task }));
    socket.on("task:updated", ({ task }) => dispatch({ type: "taskUpserted", task }));
    socket.on("task:deleted", ({ taskId }) => dispatch({ type: "taskRemoved", taskId }));
    socket.on("activity:created", ({ activity }) => dispatch({ type: "activityAdded", activity }));
    socket.on("presence:update", (payload) => dispatch({ type: "presence", ...payload }));
    return () => { socketRef.current = null; socket.close(); };
  }, [user]);

  useEffect(() => {
    if (!state.board?.id) return;
    saveBoardCache(state.board.id, { board: state.board, tasks: state.tasks, activities: state.activities });
  }, [state.board, state.tasks, state.activities]);

  const flushQueue = useCallback(async () => {
    const queue = getQueue();
    if (!queue.length) return;
    const remaining = [];
    for (const operation of queue) {
      try {
        let data;
        if (operation.method === "POST") data = await api.post(operation.path, operation.body);
        if (operation.method === "PATCH") data = await api.patch(operation.path, operation.body);
        if (operation.method === "DELETE") data = await api.delete(operation.path, operation.body);
        if (data?.task) dispatch({ type: "taskUpserted", task: data.task });
      } catch (error) {
        if (error.status === 409) dispatch({ type: "conflict", conflict: { operation, latestTask: error.details?.latestTask } });
        else if (error.isNetworkError) remaining.push(operation);
        else dispatch({ type: "notice", message: `A saved change could not be applied: ${error.message}` });
      }
    }
    replaceQueue(remaining);
    dispatch({ type: "pending", count: remaining.length });
    if (!remaining.length) dispatch({ type: "online", notice: "All offline changes are now synchronized." });
  }, []);

  useEffect(() => {
    const onOnline = () => { dispatch({ type: "online" }); flushQueue(); };
    const onOffline = () => dispatch({ type: "offline" });
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    if (navigator.onLine) flushQueue();
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, [flushQueue]);

  async function createBoard(input) {
    const data = await api.post("/boards", input);
    dispatch({ type: "boardUpserted", board: data.board });
    await loadBoard(data.board.id);
    return data.board;
  }

  async function createTask(input) {
    const boardId = stateRef.current.board.id;
    const clientId = crypto.randomUUID();
    const body = { ...input, clientId };
    try {
      const data = await api.post(`/boards/${boardId}/tasks`, body);
      dispatch({ type: "taskUpserted", task: data.task });
      return data.task;
    } catch (error) {
      if (!error.isNetworkError) throw error;
      const temporary = { ...body, id: `offline-${clientId}`, boardId, revision: 0, createdBy: user, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), comments: [], assignee: stateRef.current.board.members.find((member) => member.user.id === body.assignee)?.user || null };
      dispatch({ type: "taskUpserted", task: temporary });
      enqueue({ method: "POST", path: `/boards/${boardId}/tasks`, body });
      dispatch({ type: "pending", count: getQueue().length });
      dispatch({ type: "offline" });
      return temporary;
    }
  }

  async function updateTask(task, changes) {
    const boardId = stateRef.current.board.id;
    if (String(task.id).startsWith("offline-")) {
      const queue = getQueue().map((operation) => operation.method === "POST" && operation.body.clientId === task.clientId ? { ...operation, body: { ...operation.body, ...changes } } : operation);
      replaceQueue(queue);
      const optimistic = { ...task, ...changes, updatedAt: new Date().toISOString() };
      dispatch({ type: "taskUpserted", task: optimistic });
      return optimistic;
    }
    const body = { ...changes, expectedRevision: task.revision };
    try {
      const data = await api.patch(`/boards/${boardId}/tasks/${task.id}`, body);
      dispatch({ type: "taskUpserted", task: data.task });
      return data.task;
    } catch (error) {
      if (error.status === 409) {
        dispatch({ type: "conflict", conflict: { attemptedTask: { ...task, ...changes }, latestTask: error.details?.latestTask } });
        throw error;
      }
      if (!error.isNetworkError) throw error;
      const optimistic = { ...task, ...changes, updatedAt: new Date().toISOString() };
      dispatch({ type: "taskUpserted", task: optimistic });
      enqueue({ method: "PATCH", path: `/boards/${boardId}/tasks/${task.id}`, body });
      dispatch({ type: "pending", count: getQueue().length });
      dispatch({ type: "offline" });
      return optimistic;
    }
  }

  async function deleteTask(task) {
    const boardId = stateRef.current.board.id;
    if (String(task.id).startsWith("offline-")) {
      const queue = getQueue().filter((operation) => !(operation.method === "POST" && operation.body.clientId === task.clientId));
      replaceQueue(queue);
      dispatch({ type: "pending", count: queue.length });
      dispatch({ type: "taskRemoved", taskId: task.id });
      return;
    }
    const path = `/boards/${boardId}/tasks/${task.id}`;
    try {
      await api.delete(path, { expectedRevision: task.revision });
      dispatch({ type: "taskRemoved", taskId: task.id });
    } catch (error) {
      if (error.status === 409) {
        dispatch({ type: "conflict", conflict: { attemptedTask: task, latestTask: error.details?.latestTask } });
        throw error;
      }
      if (!error.isNetworkError) throw error;
      dispatch({ type: "taskRemoved", taskId: task.id });
      enqueue({ method: "DELETE", path, body: { expectedRevision: task.revision } });
      dispatch({ type: "pending", count: getQueue().length });
      dispatch({ type: "offline" });
    }
  }

  async function addComment(task, message) {
    const data = await api.post(`/boards/${stateRef.current.board.id}/tasks/${task.id}/comments`, { message, expectedRevision: task.revision });
    dispatch({ type: "taskUpserted", task: data.task });
    return data.task;
  }

  async function addMember(userId, role) {
    const data = await api.post(`/boards/${stateRef.current.board.id}/members`, { userId, role });
    dispatch({ type: "boardUpserted", board: data.board });
    return data.board;
  }

  async function removeMember(userId) {
    const data = await api.delete(`/boards/${stateRef.current.board.id}/members/${userId}`);
    dispatch({ type: "boardUpserted", board: data.board });
  }

  const value = useMemo(() => ({
    ...state, loadBoards, loadBoard, createBoard, createTask, updateTask, deleteTask, addComment,
    addMember, removeMember, clearConflict: () => dispatch({ type: "clearConflict" })
  }), [state, loadBoards, loadBoard]);
  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoards() {
  const value = useContext(BoardContext);
  if (!value) throw new Error("useBoards must be used inside BoardProvider.");
  return value;
}
