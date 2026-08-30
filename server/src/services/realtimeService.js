let ioInstance = null;

function setIo(io) {
  ioInstance = io;
}

function emitToBoard(boardId, event, payload) {
  if (ioInstance) ioInstance.to(`board:${boardId}`).emit(event, payload);
}

function emitToUsers(userIds, event, payload) {
  if (!ioInstance) return;
  userIds.forEach((id) => ioInstance.to(`user:${id}`).emit(event, payload));
}

function getIo() {
  return ioInstance;
}

module.exports = { setIo, emitToBoard, emitToUsers, getIo };

