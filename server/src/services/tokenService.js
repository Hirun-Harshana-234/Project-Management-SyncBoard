const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

function createAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, type: "access" },
    env.accessSecret,
    { expiresIn: env.accessTokenTtl, issuer: "pms", audience: "pms-client" }
  );
}

function createRefreshToken(user) {
  const token = jwt.sign(
    { sub: user._id.toString(), type: "refresh", nonce: crypto.randomUUID() },
    env.refreshSecret,
    { expiresIn: `${env.refreshTokenDays}d`, issuer: "pms", audience: "pms-client" }
  );
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + env.refreshTokenDays * 86400000)
  };
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.accessSecret, { issuer: "pms", audience: "pms-client" });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshSecret, { issuer: "pms", audience: "pms-client" });
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "strict" : "lax",
    path: "/api/auth",
    maxAge: env.refreshTokenDays * 86400000
  };
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  refreshCookieOptions
};
