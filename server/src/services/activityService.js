const Activity = require("../models/Activity");
const { emitToBoard } = require("./realtimeService");

async function recordActivity({ board, actor, action, targetType, targetId, summary, metadata = {} }) {
  const activity = await Activity.create({ board, actor, action, targetType, targetId, summary, metadata });
  const populated = await Activity.findById(activity._id).populate("actor", "displayName username avatarColor").lean();
  emitToBoard(board.toString(), "activity:created", { activity: populated });
  return populated;
}

module.exports = { recordActivity };

