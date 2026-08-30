const mongoose = require("mongoose");
const Board = require("../models/Board");
const Task = require("../models/Task");
const Activity = require("../models/Activity");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { requiredString, pick } = require("../utils/validation");
const { mapBoard, mapTask } = require("../utils/presenters");
const { emitToBoard, emitToUsers } = require("../services/realtimeService");
const { recordActivity } = require("../services/activityService");

const userFields = "displayName username email role jobTitle department progress active avatarColor lastSeenAt createdAt";

async function listBoards(req, res) {
  const query = req.user.role === "admin" ? { archived: false } : { "members.user": req.user._id, archived: false };
  const boards = await Board.find(query).populate("owner", userFields).populate("members.user", userFields).sort({ updatedAt: -1 });
  res.json({ boards: boards.map(mapBoard) });
}

async function createBoard(req, res) {
  const title = requiredString(req.body.title, "Board title", 100);
  const board = await Board.create({
    title,
    description: typeof req.body.description === "string" ? req.body.description.trim().slice(0, 500) : "",
    color: /^#[0-9a-fA-F]{6}$/.test(req.body.color || "") ? req.body.color : "#720eec",
    owner: req.user._id,
    members: [{ user: req.user._id, role: "owner" }]
  });
  const populated = await Board.findById(board._id).populate("owner", userFields).populate("members.user", userFields);
  const output = mapBoard(populated);
  emitToUsers([req.user._id.toString()], "board:created", { board: output });
  await recordActivity({ board: board._id, actor: req.user._id, action: "board.created", targetType: "board", targetId: board._id, summary: `created board “${title}”` });
  res.status(201).json({ board: output });
}

async function getBoard(req, res) {
  const [board, tasks, activities] = await Promise.all([
    Board.findById(req.board._id).populate("owner", userFields).populate("members.user", userFields),
    Task.find({ board: req.board._id }).populate("assignee", userFields).populate("createdBy", userFields).populate("comments.author", userFields).sort({ position: 1, createdAt: 1 }),
    Activity.find({ board: req.board._id }).populate("actor", userFields).sort({ createdAt: -1 }).limit(50).lean()
  ]);
  res.json({ board: mapBoard(board), tasks: tasks.map(mapTask), activities });
}

async function updateBoard(req, res) {
  const changes = pick(req.body, ["title", "description", "color"]);
  if (changes.title !== undefined) changes.title = requiredString(changes.title, "Board title", 100);
  if (changes.description !== undefined) changes.description = String(changes.description).trim().slice(0, 500);
  if (changes.color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(changes.color)) throw new AppError(422, "Board color must be a six-digit hex color.");
  Object.assign(req.board, changes);
  await req.board.save();
  const board = await Board.findById(req.board._id).populate("owner", userFields).populate("members.user", userFields);
  const output = mapBoard(board);
  emitToBoard(board._id.toString(), "board:updated", { board: output });
  await recordActivity({ board: board._id, actor: req.user._id, action: "board.updated", targetType: "board", targetId: board._id, summary: `updated board “${board.title}”` });
  res.json({ board: output });
}

async function archiveBoard(req, res) {
  req.board.archived = true;
  await req.board.save();
  emitToBoard(req.board._id.toString(), "board:deleted", { boardId: req.board._id.toString() });
  res.status(204).end();
}

async function addMember(req, res) {
  const userId = req.body.userId;
  if (!mongoose.isValidObjectId(userId)) throw new AppError(422, "Select a valid user.");
  const user = await User.findById(userId);
  if (!user || !user.active) throw new AppError(404, "User not found.");
  if (req.board.members.some((member) => member.user.toString() === userId)) throw new AppError(409, "This user is already a board member.");
  const role = ["editor", "viewer"].includes(req.body.role) ? req.body.role : "editor";
  req.board.members.push({ user: user._id, role });
  await req.board.save();
  const board = await Board.findById(req.board._id).populate("owner", userFields).populate("members.user", userFields);
  const output = mapBoard(board);
  emitToBoard(board._id.toString(), "board:updated", { board: output });
  emitToUsers([user._id.toString()], "board:created", { board: output });
  await recordActivity({ board: board._id, actor: req.user._id, action: "member.added", targetType: "member", targetId: user._id, summary: `added ${user.displayName} to the board`, metadata: { role } });
  res.status(201).json({ board: output });
}

async function removeMember(req, res) {
  const userId = req.params.userId;
  if (req.board.owner.toString() === userId) throw new AppError(422, "The board owner cannot be removed.");
  const originalLength = req.board.members.length;
  req.board.members = req.board.members.filter((member) => member.user.toString() !== userId);
  if (req.board.members.length === originalLength) throw new AppError(404, "Member not found on this board.");
  await req.board.save();
  await Task.updateMany({ board: req.board._id, assignee: userId }, { $set: { assignee: null }, $inc: { revision: 1 } });
  const board = await Board.findById(req.board._id).populate("owner", userFields).populate("members.user", userFields);
  const output = mapBoard(board);
  emitToBoard(board._id.toString(), "board:updated", { board: output });
  emitToUsers([userId], "board:deleted", { boardId: board._id.toString() });
  await recordActivity({ board: board._id, actor: req.user._id, action: "member.removed", targetType: "member", targetId: userId, summary: "removed a member from the board" });
  res.json({ board: output });
}

module.exports = { listBoards, createBoard, getBoard, updateBoard, archiveBoard, addMember, removeMember };
