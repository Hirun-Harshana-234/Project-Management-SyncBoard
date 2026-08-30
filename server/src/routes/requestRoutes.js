const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const controller = require("../controllers/requestController");

const router = express.Router();
router.use(requireAuth);
router.get("/mine", asyncHandler(controller.listMine));
router.post("/", asyncHandler(controller.createRequest));

module.exports = router;
