import { render, screen } from "@testing-library/react";
import ActivityList from "./ActivityList";

test("renders a teammate activity entry", () => {
  render(<ActivityList activities={[{ _id: "a1", actor: { displayName: "Abhishek", username: "abhishek" }, summary: "moved a task to Done", createdAt: new Date().toISOString() }]} />);
  expect(screen.getByText("Abhishek")).toBeInTheDocument();
  expect(screen.getByText(/moved a task to Done/)).toBeInTheDocument();
  expect(screen.getByText("just now")).toBeInTheDocument();
});

