const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  displayName: { type: String, required: true, trim: true, maxlength: 80 },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 40 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  jobTitle: { type: String, trim: true, maxlength: 80, default: "Project Member" },
  department: { type: String, trim: true, maxlength: 80, default: "Project Team" },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  active: { type: Boolean, default: true },
  avatarColor: { type: String, default: "#720eec" },
  refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
  lastSeenAt: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.index({ displayName: "text", username: "text", email: "text" });

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    displayName: this.displayName,
    username: this.username,
    email: this.email,
    role: this.role,
    jobTitle: this.jobTitle,
    department: this.department,
    progress: this.progress,
    active: this.active,
    avatarColor: this.avatarColor,
    createdAt: this.createdAt,
    lastSeenAt: this.lastSeenAt
  };
};

module.exports = mongoose.model("User", userSchema);
