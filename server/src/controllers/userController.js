const User = require("../models/User");
const { mapUser } = require("../utils/presenters");

async function searchUsers(req, res) {
  const search = String(req.query.search || "").trim().slice(0, 80);
  const query = { active: true, _id: { $ne: req.user._id } };
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = ["displayName", "username", "email"].map((field) => ({ [field]: new RegExp(escaped, "i") }));
  }
  const users = await User.find(query).sort({ displayName: 1 }).limit(30);
  res.json({ users: users.map(mapUser) });
}

module.exports = { searchUsers };

