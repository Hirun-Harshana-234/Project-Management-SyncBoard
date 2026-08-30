const API_URL = "/api";
const TOKEN_KEY = "pms:accessToken";
let accessToken = localStorage.getItem(TOKEN_KEY);
let refreshPromise = null;

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.isNetworkError = status === 0;
  }
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || null;
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  else localStorage.removeItem(TOKEN_KEY);
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.message || "Request failed.", response.status, data.details);
  return data;
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    }).then(parseResponse).then((data) => {
      setAccessToken(data.accessToken);
      return data;
    }).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function request(path, options = {}, retry = true) {
  const headers = { ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}), ...options.headers };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers,
      body: options.body !== undefined && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
    });
    if (response.status === 401 && retry && !path.startsWith("/auth/")) {
      try { await refreshSession(); } catch { setAccessToken(null); throw new ApiError("Your session has expired. Please sign in again.", 401); }
      return request(path, options, false);
    }
    return parseResponse(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("You appear to be offline. Your work will be kept on this device.", 0);
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path, body) => request(path, { method: "DELETE", body })
};

export { API_URL, refreshSession };
