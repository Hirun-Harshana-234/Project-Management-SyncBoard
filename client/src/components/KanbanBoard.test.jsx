import { fireEvent, render, screen } from "@testing-library/react";
import KanbanBoard from "./KanbanBoard";

const task = { id: "t1", title: "Build real-time board", description: "Socket sync", status: "todo", priority: "high", position: 1, revision: 0, tags: [], comments: [] };

test("renders all workflow columns and the matching task", () => {
  render(<KanbanBoard tasks={[task]} onOpenTask={jest.fn()} onMoveTask={jest.fn()} onAddTask={jest.fn()} />);
  expect(screen.getByText("Assigned")).toBeInTheDocument();
  expect(screen.getByText("Ongoing")).toBeInTheDocument();
  expect(screen.getByText("Done")).toBeInTheDocument();
  expect(screen.getByText("Build real-time board")).toBeInTheDocument();
});

test("moves a dragged task to another column", () => {
  const onMoveTask = jest.fn();
  const { container } = render(<KanbanBoard tasks={[task]} onOpenTask={jest.fn()} onMoveTask={onMoveTask} onAddTask={jest.fn()} />);
  const dataTransfer = { data: {}, setData(type, value) { this.data[type] = value; }, getData(type) { return this.data[type]; }, effectAllowed: "" };
  fireEvent.dragStart(screen.getByText("Build real-time board").closest("article"), { dataTransfer });
  fireEvent.drop(container.querySelector(".column-done"), { dataTransfer });
  expect(onMoveTask).toHaveBeenCalledWith(task, "done");
});
