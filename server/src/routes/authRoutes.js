const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const controller = require("../controllers/authController");

const router = express.Router();
router.post("/register", asyncHandler(controller.register));
router.post("/login", asyncHandler(controller.login));
router.post("/refresh", asyncHandler(controller.refresh));
router.post("/logout", asyncHandler(controller.logout));
router.get("/me", requireAuth, asyncHandler(controller.me));
router.patch("/profile", requireAuth, asyncHandler(controller.updateProfile));

module.exports = router;
