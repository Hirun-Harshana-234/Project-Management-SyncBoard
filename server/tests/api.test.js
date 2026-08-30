const request = require("supertest");
const mongoose = require("mongoose");
const { createApp } = require("../src/app");
const { connectDatabase, disconnectDatabase } = require("../src/config/database");

const app = createApp();
const testMongoUri = process.env.TEST_MONGO_URI;
const describeWithDatabase = testMongoUri ? describe : describe.skip;

async function registerUser(suffix = "one") {
  const response = await request(app).post("/api/auth/register").send({
    displayName: `Test User ${suffix}`,
    username: `tester_${suffix}`,
    email: `tester_${suffix}@example.com`,
    password: "SecurePass123"
  });
  return response;
}

beforeAll(async () => { if (testMongoUri) await connectDatabase(testMongoUri); });
afterEach(async () => {
  if (!testMongoUri) return;
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});
afterAll(async () => { if (testMongoUri) await disconnectDatabase(); });

describeWithDatabase("authentication and protected routes", () => {
  test("registers a user, creates a starter board, and returns a JWT", async () => {
    const response = await registerUser("registration");
    expect(response.status).toBe(201);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({ username: "tester_registration", role: "user" });
    expect(response.body.defaultBoardId).toEqual(expect.any(String));
  });

  test("rejects access to boards without an access token", async () => {
    const response = await request(app).get("/api/boards");
    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/authentication/i);
  });

  test("logs in with an existing username and password", async () => {
    await registerUser("login");
    const response = await request(app).post("/api/auth/login").send({ login: "tester_login", password: "SecurePass123" });
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("tester_login@example.com");
  });
});

describeWithDatabase("task CRUD and conflict protection", () => {
  test("creates, moves, and deletes a task through the REST API", async () => {
    const registration = await registerUser("crud");
    const token = registration.body.accessToken;
    const boardId = registration.body.defaultBoardId;
    const create = await request(app).post(`/api/boards/${boardId}/tasks`).set("Authorization", `Bearer ${token}`).send({ title: "Ship the API", priority: "high" });
    expect(create.status).toBe(201);
    expect(create.body.task).toMatchObject({ title: "Ship the API", status: "todo", progress: 0, category: "General", revision: 0 });

    const update = await request(app).patch(`/api/boards/${boardId}/tasks/${create.body.task.id}`).set("Authorization", `Bearer ${token}`).send({ status: "done", expectedRevision: 0 });
    expect(update.status).toBe(200);
    expect(update.body.task).toMatchObject({ status: "done", progress: 100, revision: 1 });

    const remove = await request(app).delete(`/api/boards/${boardId}/tasks/${create.body.task.id}`).set("Authorization", `Bearer ${token}`).send({ expectedRevision: 1 });
    expect(remove.status).toBe(204);
  });

  test("returns 409 and the latest task when a stale edit is submitted", async () => {
    const registration = await registerUser("conflict");
    const token = registration.body.accessToken;
    const boardId = registration.body.defaultBoardId;
    const create = await request(app).post(`/api/boards/${boardId}/tasks`).set("Authorization", `Bearer ${token}`).send({ title: "Concurrent edit" });
    const taskId = create.body.task.id;
    await request(app).patch(`/api/boards/${boardId}/tasks/${taskId}`).set("Authorization", `Bearer ${token}`).send({ title: "Fresh version", expectedRevision: 0 });
    const stale = await request(app).patch(`/api/boards/${boardId}/tasks/${taskId}`).set("Authorization", `Bearer ${token}`).send({ title: "Stale version", expectedRevision: 0 });
    expect(stale.status).toBe(409);
    expect(stale.body.details.code).toBe("EDIT_CONFLICT");
    expect(stale.body.details.latestTask).toMatchObject({ title: "Fresh version", revision: 1 });
  });
});
