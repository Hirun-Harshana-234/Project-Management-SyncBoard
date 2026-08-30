const User = require("./models/User");
const Board = require("./models/Board");
const Task = require("./models/Task");
const { connectDatabase, disconnectDatabase } = require("./config/database");

const teamProfiles = [
  { displayName: "Nethmi Silva", username: "nethmi.ui", email: "nethmi@pms.local", jobTitle: "UI/UX Designer", department: "Design", progress: 82, avatarColor: "#720eec" },
  { displayName: "Kavindu Perera", username: "kavindu.backend", email: "kavindu@pms.local", jobTitle: "Backend Developer", department: "Engineering", progress: 68, avatarColor: "#2ea2cc" },
  { displayName: "Sahan Fernando", username: "sahan.devops", email: "sahan@pms.local", jobTitle: "DevOps Engineer", department: "Infrastructure", progress: 57, avatarColor: "#ffba00" },
  { displayName: "Dinithi Jayasinghe", username: "dinithi.frontend", email: "dinithi@pms.local", jobTitle: "Frontend Developer", department: "Engineering", progress: 74, avatarColor: "#7ad03a" },
  { displayName: "Tharindu Wijesinghe", username: "tharindu.qa", email: "tharindu@pms.local", jobTitle: "QA Engineer", department: "Quality Assurance", progress: 63, avatarColor: "#a00" }
];

async function ensureAccount(profile, password, forceRole) {
  let user = await User.findOne({ $or: [{ email: profile.email }, { username: profile.username }] }).select("+passwordHash");
  if (!user) user = new User(profile);
  Object.assign(user, profile);
  if (forceRole) user.role = forceRole;
  if (!user.passwordHash || !(await user.comparePassword(password))) await user.setPassword(password);
  user.active = true;
  await user.save();
  return user;
}

async function ensureAdmin() {
  const password = String(process.env.ADMIN_PASSWORD || "admin@123");
  return ensureAccount({
    displayName: process.env.ADMIN_NAME || "PMS Administrator",
    username: String(process.env.ADMIN_USERNAME || "admin@login").trim().toLowerCase(),
    email: String(process.env.ADMIN_EMAIL || "admin@pms.local").trim().toLowerCase(),
    jobTitle: "System Administrator",
    department: "Project Administration",
    progress: 100,
    avatarColor: "#2ea2cc"
  }, password, "admin");
}

async function ensureDemoMember() {
  const password = String(process.env.MEMBER_PASSWORD || "pms@123");
  return ensureAccount({
    displayName: process.env.MEMBER_NAME || "PMS Project Member",
    username: String(process.env.MEMBER_USERNAME || "login@pms").trim().toLowerCase(),
    email: String(process.env.MEMBER_EMAIL || "login@pms.local").trim().toLowerCase(),
    jobTitle: "Project Coordinator",
    department: "Project Management",
    progress: 76,
    avatarColor: "#720eec"
  }, password, "user");
}

async function ensureDemoWorkspace() {
  const [admin, member] = await Promise.all([ensureAdmin(), ensureDemoMember()]);
  const teammates = [];
  for (const profile of teamProfiles) teammates.push(await ensureAccount(profile, "PmsTeam@123", "user"));

  let board = await Board.findOne({ title: "PMS Implementation Project", archived: false });
  const allMembers = [member, ...teammates];
  if (!board) {
    board = await Board.create({
      title: "PMS Implementation Project",
      description: "Plan, deliver, test, and launch Project Management SyncBoard as one coordinated team.",
      color: "#720eec",
      owner: member._id,
      members: allMembers.map((user, index) => ({ user: user._id, role: index === 0 ? "owner" : "editor" }))
    });
  } else {
    board.owner = member._id;
    const existingIds = new Set(board.members.map((entry) => entry.user.toString()));
    for (const [index, user] of allMembers.entries()) {
      if (!existingIds.has(user._id.toString())) board.members.push({ user: user._id, role: index === 0 ? "owner" : "editor" });
    }
    await board.save();
  }

  if (await Task.countDocuments({ board: board._id }) === 0) {
    const due = (days) => new Date(Date.now() + days * 86400000);
    await Task.insertMany([
      { board: board._id, title: "Finalize project requirements", description: "Review the full brief and confirm acceptance criteria for every milestone.", status: "done", progress: 100, priority: "high", category: "Planning", createdBy: member._id, assignee: member._id, dueDate: due(-4), tags: ["requirements", "M1"], position: 1 },
      { board: board._id, title: "Complete responsive interface", description: "Finish member and administrator pages using the PMS visual system.", status: "doing", progress: 74, priority: "high", category: "Frontend", createdBy: member._id, assignee: teammates[3]._id, dueDate: due(3), tags: ["react", "responsive"], position: 2 },
      { board: board._id, title: "Verify REST API contracts", description: "Confirm authentication, CRUD, validation, and conflict responses.", status: "doing", progress: 68, priority: "urgent", category: "Backend", createdBy: member._id, assignee: teammates[1]._id, dueDate: due(2), tags: ["express", "api"], position: 3 },
      { board: board._id, title: "Prepare deployment pipeline", description: "Validate Docker Compose, environment variables, and production health checks.", status: "todo", progress: 20, priority: "medium", category: "DevOps", createdBy: member._id, assignee: teammates[2]._id, dueDate: due(6), tags: ["docker", "deployment"], position: 4 },
      { board: board._id, title: "Run cross-browser QA", description: "Test authentication, task workflows, reports, dark mode, and responsive layouts.", status: "todo", progress: 10, priority: "medium", category: "Testing", createdBy: member._id, assignee: teammates[4]._id, dueDate: due(7), tags: ["qa", "tests"], position: 5 },
      { board: board._id, title: "Polish PMS component library", description: "Refine typography, colors, controls, and accessible interaction states.", status: "doing", progress: 82, priority: "medium", category: "Design", createdBy: member._id, assignee: teammates[0]._id, dueDate: due(4), tags: ["design-system", "ui"], position: 6 }
    ]);
  }
  return { admin, member, board };
}

async function seedDemo() {
  await connectDatabase();
  await ensureDemoWorkspace();
  await disconnectDatabase();
}

if (require.main === module) {
  seedDemo().then(() => console.log("PMS demo accounts and project data are ready.")).catch(async (error) => {
    console.error(error);
    await disconnectDatabase();
    process.exit(1);
  });
}

module.exports = { ensureAdmin, ensureDemoMember, ensureDemoWorkspace, seedDemo };
