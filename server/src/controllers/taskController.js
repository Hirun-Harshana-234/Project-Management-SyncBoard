const mongoose = require("mongoose");
const Task = require("../models/Task");
const AppError = require("../utils/AppError");
const { requiredString, pick } = require("../utils/validation");
const { mapTask } = require("../utils/presenters");
const { emitToBoard } = require("../services/realtimeService");
const { recordActivity } = require("../services/activityService");

const userFields = "displayName username email role jobTitle department progress active avatarColor lastSeenAt createdAt";
const taskPopulate = [
  { path: "assignee", select: userFields },
  { path: "createdBy", select: userFields },
  { path: "comments.author", select: userFields }
];

async function populatedTask(id) {
  return Task.findById(id).populate(taskPopulate);
}

function validateAssignee(board, assignee) {
  if (assignee === null || assignee === "") return null;
  if (!mongoose.isValidObjectId(assignee) || !board.members.some((member) => member.user.toString() === assignee)) {
    throw new AppError(422, "Assignee must be a member of this board.");
  }
  return assignee;
}

function expectedRevision(body) {
  const value = Number(body.expectedRevision);
  if (!Number.isInteger(value) || value < 0) throw new AppError(428, "The current task revision is required for this change.");
  return value;
}

async function conflictResponse(taskId) {
  const latest = await populatedTask(taskId);
  throw new AppError(409, "This task was changed by a teammate. Review the latest version before trying again.", {
    code: "EDIT_CONFLICT",
    latestTask: latest ? mapTask(latest) : null
  });
}

async function createTask(req, res) {
  const title = requiredString(req.body.title, "Task title", 160);
  if (req.body.clientId) {
    const existing = await Task.findOne({ board: req.board._id, createdBy: req.user._id, clientId: req.body.clientId }).populate(taskPopulate);
    if (existing) return res.status(200).json({ task: mapTask(existing), replayed: true });
  }
  const task = await Task.create({
    board: req.board._id,
    title,
    description: typeof req.body.description === "string" ? req.body.description.trim().slice(0, 3000) : "",
    status: ["todo", "doing", "done"].includes(req.body.status) ? req.body.status : "todo",
    priority: ["low", "medium", "high", "urgent"].includes(req.body.priority) ? req.body.priority : "medium",
    category: typeof req.body.category === "string" && req.body.category.trim() ? req.body.category.trim().slice(0, 60) : "General",
    progress: Number.isFinite(Number(req.body.progress)) ? Math.max(0, Math.min(100, Math.round(Number(req.body.progress)))) : req.body.status === "done" ? 100 : req.body.status === "doing" ? 50 : 0,
    assignee: validateAssignee(req.board, req.body.assignee),
    createdBy: req.user._id,
    dueDate: req.body.dueDate || null,
    tags: Array.isArray(req.body.tags) ? req.body.tags.map((tag) => String(tag).trim().slice(0, 30)).filter(Boolean).slice(0, 6) : [],
    position: Number.isFinite(Number(req.body.position)) ? Number(req.body.position) : Date.now(),
    clientId: typeof req.body.clientId === "string" ? req.body.clientId.slice(0, 100) : undefined
  });
  const output = mapTask(await populatedTask(task._id));
  emitToBoard(req.board._id.toString(), "task:created", { task: output });
  await recordActivity({ board: req.board._id, actor: req.user._id, action: "task.created", targetType: "task", targetId: task._id, summary: `created task “${task.title}”` });
  res.status(201).json({ task: output });
}

async function getTask(req, res) {
  const task = await Task.findOne({ _id: req.params.taskId, board: req.board._id }).populate(taskPopulate);
  if (!task) throw new AppError(404, "Task not found.");
  res.json({ task: mapTask(task) });
}

async function updateTask(req, res) {
  const revision = expectedRevision(req.body);
  const changes = pick(req.body, ["title", "description", "status", "priority", "category", "progress", "assignee", "dueDate", "tags", "position"]);
  if (changes.title !== undefined) changes.title = requiredString(changes.title, "Task title", 160);
  if (changes.description !== undefined) changes.description = String(changes.description).trim().slice(0, 3000);
  if (changes.status !== undefined && !["todo", "doing", "done"].includes(changes.status)) throw new AppError(422, "Select a valid task status.");
  if (changes.priority !== undefined && !["low", "medium", "high", "urgent"].includes(changes.priority)) throw new AppError(422, "Select a valid task priority.");
  if (changes.category !== undefined) changes.category = requiredString(changes.category, "Category", 60);
  if (changes.progress !== undefined) {
    changes.progress = Number(changes.progress);
    if (!Number.isFinite(changes.progress) || changes.progress < 0 || changes.progress > 100) throw new AppError(422, "Progress must be between 0 and 100.");
    changes.progress = Math.round(changes.progress);
  }
  if (changes.assignee !== undefined) changes.assignee = validateAssignee(req.board, changes.assignee);
  if (changes.tags !== undefined) changes.tags = Array.isArray(changes.tags) ? changes.tags.map((tag) => String(tag).trim().slice(0, 30)).filter(Boolean).slice(0, 6) : [];
  if (changes.dueDate === "") changes.dueDate = null;
  if (changes.position !== undefined) changes.position = Number(changes.position) || Date.now();

  const before = await Task.findOne({ _id: req.params.taskId, board: req.board._id }).lean();
  if (!before) throw new AppError(404, "Task not found.");
  if (changes.status !== undefined && changes.progress === undefined) {
    if (changes.status === "done") changes.progress = 100;
    if (changes.status === "todo") changes.progress = 0;
    if (changes.status === "doing") changes.progress = Math.max(1, Math.min(99, before.progress || 50));
  }
  const updated = await Task.findOneAndUpdate(
    { _id: req.params.taskId, board: req.board._id, revision },
    { $set: changes, $inc: { revision: 1 } },
    { new: true, runValidators: true }
  ).populate(taskPopulate);
  if (!updated) return conflictResponse(req.params.taskId);
  const output = mapTask(updated);
  emitToBoard(req.board._id.toString(), "task:updated", { task: output, changedBy: req.user._id.toString() });
  const moved = changes.status !== undefined && changes.status !== before.status;
  await recordActivity({
    board: req.board._id,
    actor: req.user._id,
    action: moved ? "task.moved" : "task.updated",
    targetType: "task",
    targetId: updated._id,
    summary: moved ? `moved “${updated.title}” to ${updated.status === "doing" ? "Ongoing" : updated.status === "done" ? "Done" : "Assigned"}` : `updated task “${updated.title}”`,
    metadata: moved ? { from: before.status, to: updated.status } : {}
  });
  res.json({ task: output });
}

async function deleteTask(req, res) {
  const revision = expectedRevision(req.body);
  const task = await Task.findOneAndDelete({ _id: req.params.taskId, board: req.board._id, revision });
  if (!task) {
    const exists = await Task.exists({ _id: req.params.taskId, board: req.board._id });
    if (exists) return conflictResponse(req.params.taskId);
    throw new AppError(404, "Task not found.");
  }
  emitToBoard(req.board._id.toString(), "task:deleted", { taskId: task._id.toString() });
  await recordActivity({ board: req.board._id, actor: req.user._id, action: "task.deleted", targetType: "task", targetId: task._id, summary: `deleted task “${task.title}”` });
  res.status(204).end();
}

async function addComment(req, res) {
  const revision = expectedRevision(req.body);
  const message = requiredString(req.body.message, "Comment", 1000);
  const task = await Task.findOneAndUpdate(
    { _id: req.params.taskId, board: req.board._id, revision },
    { $push: { comments: { author: req.user._id, message } }, $inc: { revision: 1 } },
    { new: true, runValidators: true }
  ).populate(taskPopulate);
  if (!task) return conflictResponse(req.params.taskId);
  const output = mapTask(task);
  emitToBoard(req.board._id.toString(), "task:updated", { task: output, changedBy: req.user._id.toString() });
  await recordActivity({ board: req.board._id, actor: req.user._id, action: "comment.added", targetType: "task", targetId: task._id, summary: `commented on “${task.title}”` });
  res.status(201).json({ task: output });
}

module.exports = { createTask, getTask, updateTask, deleteTask, addComment };
