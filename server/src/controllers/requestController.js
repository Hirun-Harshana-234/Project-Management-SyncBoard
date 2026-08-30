const AccessRequest = require("../models/AccessRequest");
const AppError = require("../utils/AppError");
const { requiredString } = require("../utils/validation");
const { mapUser } = require("../utils/presenters");

function mapRequest(item) {
  const value = item.toObject ? item.toObject() : item;
  return {
    id: value._id.toString(),
    requester: value.requester?._id ? mapUser(value.requester) : value.requester?.toString(),
    type: value.type,
    subject: value.subject,
    message: value.message,
    status: value.status,
    response: value.response || "",
    reviewedBy: value.reviewedBy?._id ? mapUser(value.reviewedBy) : null,
    reviewedAt: value.reviewedAt,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

async function createRequest(req, res) {
  const type = ["access", "role", "support"].includes(req.body.type) ? req.body.type : "access";
  const request = await AccessRequest.create({
    requester: req.user._id,
    type,
    subject: requiredString(req.body.subject, "Subject", 120),
    message: requiredString(req.body.message, "Message", 1500)
  });
  const populated = await AccessRequest.findById(request._id).populate("requester", "displayName username email role jobTitle department progress active avatarColor lastSeenAt createdAt");
  res.status(201).json({ request: mapRequest(populated) });
}

async function listMine(req, res) {
  const requests = await AccessRequest.find({ requester: req.user._id }).populate("reviewedBy", "displayName username email role jobTitle department progress active avatarColor lastSeenAt createdAt").sort({ createdAt: -1 });
  res.json({ requests: requests.map(mapRequest) });
}

async function listAll(_req, res) {
  const requests = await AccessRequest.find().populate("requester", "displayName username email role jobTitle department progress active avatarColor lastSeenAt createdAt").populate("reviewedBy", "displayName username email role jobTitle department progress active avatarColor lastSeenAt createdAt").sort({ createdAt: -1 });
  res.json({ requests: requests.map(mapRequest) });
}

async function reviewRequest(req, res) {
  const request = await AccessRequest.findById(req.params.requestId);
  if (!request) throw new AppError(404, "Request not found.");
  if (!["pending", "approved", "rejected"].includes(req.body.status)) throw new AppError(422, "Select a valid request status.");
  request.status = req.body.status;
  request.response = typeof req.body.response === "string" ? req.body.response.trim().slice(0, 1000) : request.response;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  await request.save();
  const populated = await AccessRequest.findById(request._id).populate("requester", "displayName username email role jobTitle department progress active avatarColor lastSeenAt createdAt").populate("reviewedBy", "displayName username email role jobTitle department progress active avatarColor lastSeenAt createdAt");
  res.json({ request: mapRequest(populated) });
}

module.exports = { createRequest, listMine, listAll, reviewRequest };
