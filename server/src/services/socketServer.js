const { Server } = require("socket.io");
const Board = require("../models/Board");
const User = require("../models/User");
const env = require("../config/env");
const { verifyAccessToken } = require("./tokenService");
const { setIo } = require("./realtimeService");

const onlineUsers = new Map();

function publicPresence(boardId, io) {
  const room = io.sockets.adapter.rooms.get(`board:${boardId}`) || new Set();
  return [...new Set([...room].map((socketId) => io.sockets.sockets.get(socketId)?.userId).filter(Boolean))];
}

function attachSocketServer(httpServer) {
  const allowedOrigins = env.clientUrl.split(",").map((item) => item.trim()).filter(Boolean);
  const io = new Server(httpServer, {
    ...(allowedOrigins.length ? { cors: { origin: allowedOrigins, credentials: true } } : {}),
    transports: ["websocket", "polling"]
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub);
      if (!user || !user.active) return next(new Error("Unauthorized"));
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    socket.join(`user:${socket.userId}`);
    onlineUsers.set(socket.userId, (onlineUsers.get(socket.userId) || 0) + 1);
    const boards = await Board.find(socket.userRole === "admin" ? { archived: false } : { "members.user": socket.userId, archived: false }).select("_id").lean();
    boards.forEach((board) => socket.join(`board:${board._id}`));
    boards.forEach((board) => io.to(`board:${board._id}`).emit("presence:update", { boardId: board._id.toString(), onlineUserIds: publicPresence(board._id.toString(), io) }));

    socket.on("board:join", async (boardId, acknowledge) => {
      const allowed = await Board.exists(socket.userRole === "admin" ? { _id: boardId, archived: false } : { _id: boardId, "members.user": socket.userId, archived: false });
      if (!allowed) return acknowledge?.({ ok: false });
      await socket.join(`board:${boardId}`);
      io.to(`board:${boardId}`).emit("presence:update", { boardId, onlineUserIds: publicPresence(boardId, io) });
      acknowledge?.({ ok: true });
    });

    socket.on("disconnect", async () => {
      const count = (onlineUsers.get(socket.userId) || 1) - 1;
      if (count <= 0) onlineUsers.delete(socket.userId); else onlineUsers.set(socket.userId, count);
      await User.updateOne({ _id: socket.userId }, { $set: { lastSeenAt: new Date() } });
      boards.forEach((board) => io.to(`board:${board._id}`).emit("presence:update", { boardId: board._id.toString(), onlineUserIds: publicPresence(board._id.toString(), io) }));
    });
  });

  setIo(io);
  return io;
}

module.exports = { attachSocketServer };
