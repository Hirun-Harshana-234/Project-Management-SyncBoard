function mapUser(user) {
  if (!user) return null;
  const value = user.toObject ? user.toObject() : user;
  return {
    id: (value._id || value.id).toString(),
    displayName: value.displayName,
    username: value.username,
    email: value.email,
    role: value.role,
    jobTitle: value.jobTitle || "Project Member",
    department: value.department || "Project Team",
    progress: Number(value.progress || 0),
    active: value.active,
    avatarColor: value.avatarColor,
    lastSeenAt: value.lastSeenAt,
    createdAt: value.createdAt
  };
}

function mapMember(member) {
  const value = member.toObject ? member.toObject() : member;
  return { user: mapUser(value.user), role: value.role, joinedAt: value.joinedAt };
}

function mapBoard(board) {
  const value = board.toObject ? board.toObject() : board;
  return {
    id: value._id.toString(),
    title: value.title,
    description: value.description,
    color: value.color,
    owner: value.owner && value.owner._id ? mapUser(value.owner) : value.owner?.toString(),
    members: Array.isArray(value.members) ? value.members.map(mapMember) : [],
    archived: value.archived,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

function mapComment(comment) {
  const value = comment.toObject ? comment.toObject() : comment;
  return {
    id: value._id.toString(),
    author: value.author && value.author._id ? mapUser(value.author) : value.author?.toString(),
    message: value.message,
    createdAt: value.createdAt
  };
}

function mapTask(task) {
  const value = task.toObject ? task.toObject() : task;
  return {
    id: value._id.toString(),
    boardId: value.board._id ? value.board._id.toString() : value.board.toString(),
    title: value.title,
    description: value.description,
    status: value.status,
    priority: value.priority,
    category: value.category || "General",
    progress: Number(value.progress || 0),
    assignee: value.assignee && value.assignee._id ? mapUser(value.assignee) : null,
    createdBy: value.createdBy && value.createdBy._id ? mapUser(value.createdBy) : value.createdBy?.toString(),
    dueDate: value.dueDate,
    tags: value.tags || [],
    position: value.position,
    revision: value.revision,
    clientId: value.clientId,
    comments: (value.comments || []).map(mapComment),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

module.exports = { mapUser, mapBoard, mapTask };
