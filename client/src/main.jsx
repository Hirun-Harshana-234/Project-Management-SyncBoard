import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { BoardProvider } from "./context/BoardContext";
import "./styles.css";

try {
  const settings = JSON.parse(localStorage.getItem("pms:settings"));
  document.documentElement.dataset.theme = settings?.darkMode ? "dark" : "light";
  document.documentElement.dataset.compact = settings?.compact ? "true" : "false";
  document.documentElement.dataset.motion = settings?.reducedMotion ? "reduced" : "full";
} catch { document.documentElement.dataset.theme = "light"; }

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><BrowserRouter><AuthProvider><BoardProvider><App /></BoardProvider></AuthProvider></BrowserRouter></React.StrictMode>
);
