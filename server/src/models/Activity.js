const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true, enum: [
    "board.created", "board.updated", "member.added", "member.removed",
    "task.created", "task.updated", "task.moved", "task.deleted", "comment.added"
  ] },
  targetType: { type: String, enum: ["board", "task", "member"], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  summary: { type: String, required: true, maxlength: 240 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

activitySchema.index({ board: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);

