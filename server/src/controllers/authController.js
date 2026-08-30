const User = require("../models/User");
const Board = require("../models/Board");
const AppError = require("../utils/AppError");
const { validateRegistration, emailPattern, pick, requiredString } = require("../utils/validation");
const { mapUser } = require("../utils/presenters");
const {
  createAccessToken, createRefreshToken, verifyRefreshToken, hashToken, refreshCookieOptions
} = require("../services/tokenService");

async function issueSession(user, res) {
  const refresh = createRefreshToken(user);
  user.refreshTokens = (user.refreshTokens || []).filter((item) => item.expiresAt > new Date()).slice(-4);
  user.refreshTokens.push({ tokenHash: refresh.tokenHash, expiresAt: refresh.expiresAt });
  await user.save();
  res.cookie("pms_refresh", refresh.token, refreshCookieOptions());
  return createAccessToken(user);
}

async function register(req, res) {
  const input = validateRegistration(req.body);
  const exists = await User.findOne({ $or: [{ email: input.email }, { username: input.username }] });
  if (exists) throw new AppError(409, exists.email === input.email ? "Email is already registered." : "Username is already registered.");

  const user = new User(input);
  await user.setPassword(input.password);
  await user.save();
  const board = await Board.create({
    title: `${input.displayName}'s Team Board`,
    description: "Plan work, share progress, and keep the team aligned.",
    owner: user._id,
    members: [{ user: user._id, role: "owner" }]
  });
  const accessToken = await issueSession(user, res);
  res.status(201).json({ user: mapUser(user), accessToken, defaultBoardId: board._id.toString() });
}

async function login(req, res) {
  const loginValue = requiredString(req.body.login, "Email or username", 160).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const user = await User.findOne({ $or: [{ email: loginValue }, { username: loginValue }] }).select("+passwordHash +refreshTokens");
  if (!user || !user.active || !(await user.comparePassword(password))) throw new AppError(401, "Incorrect email/username or password.");
  user.lastSeenAt = new Date();
  const accessToken = await issueSession(user, res);
  res.json({ user: mapUser(user), accessToken });
}

async function refresh(req, res) {
  const token = req.cookies.pms_refresh;
  if (!token) throw new AppError(401, "No refresh session was found.");
  let payload;
  try { payload = verifyRefreshToken(token); } catch { throw new AppError(401, "Your session has expired."); }
  const user = await User.findById(payload.sub).select("+passwordHash +refreshTokens");
  if (!user || !user.active) throw new AppError(401, "This account is unavailable.");
  const currentHash = hashToken(token);
  const valid = user.refreshTokens.some((item) => item.tokenHash === currentHash && item.expiresAt > new Date());
  if (!valid) throw new AppError(401, "Your session has expired.");
  user.refreshTokens = user.refreshTokens.filter((item) => item.tokenHash !== currentHash);
  const accessToken = await issueSession(user, res);
  res.json({ user: mapUser(user), accessToken });
}

async function logout(req, res) {
  const token = req.cookies.pms_refresh;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.updateOne({ _id: payload.sub }, { $pull: { refreshTokens: { tokenHash: hashToken(token) } } });
    } catch { /* An invalid cookie is cleared without revealing session details. */ }
  }
  res.clearCookie("pms_refresh", refreshCookieOptions());
  res.status(204).end();
}

async function me(req, res) {
  res.json({ user: mapUser(req.user) });
}

async function updateProfile(req, res) {
  const changes = pick(req.body, ["displayName", "email", "avatarColor"]);
  if (changes.displayName !== undefined) changes.displayName = requiredString(changes.displayName, "Display name", 80);
  if (changes.email !== undefined) {
    changes.email = requiredString(changes.email, "Email", 160).toLowerCase();
    if (!emailPattern.test(changes.email)) throw new AppError(422, "Enter a valid email address.");
  }
  if (changes.avatarColor !== undefined && !/^#[0-9a-fA-F]{6}$/.test(changes.avatarColor)) throw new AppError(422, "Avatar color must be a six-digit hex color.");
  Object.assign(req.user, changes);
  await req.user.save();
  res.json({ user: mapUser(req.user) });
}

module.exports = { register, login, refresh, logout, me, updateProfile };
