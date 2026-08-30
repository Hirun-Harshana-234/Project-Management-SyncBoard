const mongoose = require("mongoose");
const Board = require("../models/Board");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const loadBoard = asyncHandler(async (req, _res, next) => {
  const boardId = req.params.boardId || req.body.boardId;
  if (!mongoose.isValidObjectId(boardId)) throw new AppError(404, "Board not found.");
  const board = await Board.findById(boardId);
  if (!board || board.archived) throw new AppError(404, "Board not found.");
  const membership = board.members.find((member) => member.user.toString() === req.user._id.toString());
  if (!membership && req.user.role !== "admin") throw new AppError(403, "You are not a member of this board.");
  req.board = board;
  req.membership = membership || { role: "owner" };
  next();
});

function requireBoardEditor(req, _res, next) {
  if (req.user.role !== "admin" && req.membership?.role === "viewer") return next(new AppError(403, "This board is read-only for your account."));
  next();
}

function requireBoardOwner(req, _res, next) {
  if (req.user.role !== "admin" && req.membership?.role !== "owner") return next(new AppError(403, "Only a board owner can perform this action."));
  next();
}

module.exports = { loadBoard, requireBoardEditor, requireBoardOwner };

