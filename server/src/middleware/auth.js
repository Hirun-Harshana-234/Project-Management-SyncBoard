const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { verifyAccessToken } = require("../services/tokenService");

const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new AppError(401, "Authentication required.");

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError(401, "Your session has expired. Please sign in again.");
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.active) throw new AppError(401, "This account is unavailable.");
  req.user = user;
  next();
});

function requireRole(role) {
  return (req, _res, next) => {
    if (!req.user || req.user.role !== role) return next(new AppError(403, "You do not have permission to perform this action."));
    next();
  };
}

module.exports = { requireAuth, requireRole };

