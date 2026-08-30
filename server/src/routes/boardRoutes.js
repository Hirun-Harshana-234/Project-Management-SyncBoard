const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { loadBoard, requireBoardEditor, requireBoardOwner } = require("../middleware/boardAccess");
const board = require("../controllers/boardController");
const task = require("../controllers/taskController");

const router = express.Router();
router.use(requireAuth);
router.get("/", asyncHandler(board.listBoards));
router.post("/", asyncHandler(board.createBoard));
router.get("/:boardId", loadBoard, asyncHandler(board.getBoard));
router.patch("/:boardId", loadBoard, requireBoardOwner, asyncHandler(board.updateBoard));
router.delete("/:boardId", loadBoard, requireBoardOwner, asyncHandler(board.archiveBoard));
router.post("/:boardId/members", loadBoard, requireBoardOwner, asyncHandler(board.addMember));
router.delete("/:boardId/members/:userId", loadBoard, requireBoardOwner, asyncHandler(board.removeMember));
router.post("/:boardId/tasks", loadBoard, requireBoardEditor, asyncHandler(task.createTask));
router.get("/:boardId/tasks/:taskId", loadBoard, asyncHandler(task.getTask));
router.patch("/:boardId/tasks/:taskId", loadBoard, requireBoardEditor, asyncHandler(task.updateTask));
router.delete("/:boardId/tasks/:taskId", loadBoard, requireBoardEditor, asyncHandler(task.deleteTask));
router.post("/:boardId/tasks/:taskId/comments", loadBoard, requireBoardEditor, asyncHandler(task.addComment));

module.exports = router;

