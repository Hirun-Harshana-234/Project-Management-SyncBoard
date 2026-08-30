import { boardReducer } from "./BoardContext";

const initial = { boards: [], board: { id: "b1" }, tasks: [{ id: "t1", title: "Old", revision: 0 }], activities: [], onlineUserIds: [] };

test("replaces a task received from the real-time channel without duplicating it", () => {
  const next = boardReducer(initial, { type: "taskUpserted", task: { id: "t1", title: "Updated live", revision: 1 } });
  expect(next.tasks).toHaveLength(1);
  expect(next.tasks[0]).toMatchObject({ title: "Updated live", revision: 1 });
});

test("stores conflict details instead of silently overwriting a task", () => {
  const conflict = { latestTask: { id: "t1", revision: 2 } };
  const next = boardReducer(initial, { type: "conflict", conflict });
  expect(next.conflict).toBe(conflict);
  expect(next.notice).toMatch(/teammate changed/i);
});

