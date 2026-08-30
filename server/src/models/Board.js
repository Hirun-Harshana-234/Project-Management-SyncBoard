const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["owner", "editor", "viewer"], default: "editor" },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const boardSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  color: { type: String, default: "#720eec" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: { type: [memberSchema], default: [] },
  archived: { type: Boolean, default: false }
}, { timestamps: true, optimisticConcurrency: true });

boardSchema.index({ "members.user": 1, updatedAt: -1 });

module.exports = mongoose.model("Board", boardSchema);

