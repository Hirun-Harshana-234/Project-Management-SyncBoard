const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
  board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 3000, default: "" },
  status: { type: String, enum: ["todo", "doing", "done"], default: "todo", index: true },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  category: { type: String, trim: true, maxlength: 60, default: "General" },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dueDate: { type: Date, default: null },
  tags: { type: [String], default: [] },
  position: { type: Number, default: Date.now },
  revision: { type: Number, default: 0, min: 0 },
  clientId: { type: String, trim: true, maxlength: 100, default: undefined },
  comments: { type: [commentSchema], default: [] }
}, { timestamps: true });

taskSchema.index({ board: 1, status: 1, position: 1 });
taskSchema.index({ board: 1, createdBy: 1, clientId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Task", taskSchema);
