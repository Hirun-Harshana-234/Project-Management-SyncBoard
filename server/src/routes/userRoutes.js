const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { searchUsers } = require("../controllers/userController");

const router = express.Router();
router.get("/", requireAuth, asyncHandler(searchUsers));
module.exports = router;

