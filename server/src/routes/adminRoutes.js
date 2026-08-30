const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, requireRole } = require("../middleware/auth");
const controller = require("../controllers/adminController");

const router = express.Router();
router.use(requireAuth, requireRole("admin"));
router.get("/summary", asyncHandler(controller.summary));
router.get("/users", asyncHandler(controller.listUsers));
router.patch("/users/:userId", asyncHandler(controller.updateUser));
router.get("/requests", asyncHandler(controller.listRequests));
router.patch("/requests/:requestId", asyncHandler(controller.reviewRequest));
module.exports = router;
