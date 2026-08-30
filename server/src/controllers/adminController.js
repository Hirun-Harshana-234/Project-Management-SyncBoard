const User = require("../models/User");
const Board = require("../models/Board");
const Task = require("../models/Task");
const Activity = require("../models/Activity");
const AccessRequest = require("../models/AccessRequest");
const AppError = require("../utils/AppError");
const { mapUser } = require("../utils/presenters");

async function summary(_req, res) {
  const [users, activeUsers, boards, tasks, completed, ongoing, assigned, pendingRequests, recentActivity] = await Promise.all([
    User.countDocuments(), User.countDocuments({ active: true }), Board.countDocuments({ archived: false }),
    Task.countDocuments(), Task.countDocuments({ status: "done" }), Task.countDocuments({ status: "doing" }), Task.countDocuments({ status: "todo" }), AccessRequest.countDocuments({ status: "pending" }), Activity.find().populate("actor", "displayName username avatarColor").sort({ createdAt: -1 }).limit(12).lean()
  ]);
  res.json({ summary: { users, activeUsers, boards, tasks, completed, ongoing, assigned, pendingRequests }, recentActivity });
}

async function listUsers(_req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map(mapUser) });
}

async function updateUser(req, res) {
  const user = await User.findById(req.params.userId);
  if (!user) throw new AppError(404, "User not found.");
  if (user._id.toString() === req.user._id.toString() && req.body.active === false) throw new AppError(422, "You cannot deactivate your own account.");
  if (req.body.role !== undefined) {
    if (!["user", "admin"].includes(req.body.role)) throw new AppError(422, "Select a valid system role.");
    user.role = req.body.role;
  }
  if (req.body.active !== undefined) user.active = Boolean(req.body.active);
  await user.save();
  res.json({ user: mapUser(user) });
}

async function listRequests(req, res) {
  return require("./requestController").listAll(req, res);
}

async function reviewRequest(req, res) {
  return require("./requestController").reviewRequest(req, res);
}

module.exports = { summary, listUsers, updateUser, listRequests, reviewRequest };
