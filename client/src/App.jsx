import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import BoardPage from "./pages/BoardPage";
import TasksPage from "./pages/TasksPage";
import AddTaskPage from "./pages/AddTaskPage";
import TeamPage from "./pages/TeamPage";
import ReportsPage from "./pages/ReportsPage";
import NotificationsPage from "./pages/NotificationsPage";
import RequestsPage from "./pages/RequestsPage";
import SettingsPage from "./pages/SettingsPage";
import ActivityPage from "./pages/ActivityPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import AdminMembersPage from "./pages/AdminMembersPage";
import AdminRequestsPage from "./pages/AdminRequestsPage";
import NotFoundPage from "./pages/NotFoundPage";
import AppShell from "./components/AppShell";
import AdminShell from "./components/AdminShell";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return <Routes>
    <Route path="/login" element={<AuthPage />} />
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
      <Route index element={<Navigate to="/home" replace />} />
      <Route path="home" element={<HomePage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="board" element={<BoardPage />} />
      <Route path="tasks" element={<TasksPage />} />
      <Route path="add-task" element={<AddTaskPage />} />
      <Route path="members" element={<TeamPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="request-admin" element={<RequestsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="activity" element={<ActivityPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="team" element={<Navigate to="/members" replace />} />
    </Route>
    <Route path="/admin" element={<ProtectedRoute admin adminRedirect><AdminShell /></ProtectedRoute>}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<AdminPage />} />
      <Route path="tasks" element={<TasksPage adminMode />} />
      <Route path="add-task" element={<AddTaskPage adminMode />} />
      <Route path="members" element={<AdminMembersPage />} />
      <Route path="reports" element={<ReportsPage adminMode />} />
      <Route path="requests" element={<AdminRequestsPage />} />
      <Route path="settings" element={<SettingsPage adminMode />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>;
}
