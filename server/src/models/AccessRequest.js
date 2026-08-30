const mongoose = require("mongoose");

const accessRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["access", "role", "support"], default: "access" },
  subject: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 1500 },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  response: { type: String, trim: true, maxlength: 1000, default: "" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null }
}, { timestamps: true });

accessRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("AccessRequest", accessRequestSchema);
