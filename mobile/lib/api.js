import * as SecureStore from "expo-secure-store";
import { API_URL } from "../constants/api";

const TOKEN_KEY = "budgies_token";

// Core request helper — attaches the Bearer token and parses JSON.
// Returns { ok, status, data }. Never throws on HTTP errors so callers
// can branch on status (e.g. 403 = not paired).
async function request(path, { method = "GET", body, isForm = false } = {}) {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);

    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!isForm) headers["Content-Type"] = "application/json";

    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // Network/connection failure
    return { ok: false, status: 0, data: { message: "Network error" } };
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  del: (path) => request(path, { method: "DELETE" }),

  // multipart upload (photos) — pass a FormData object
  upload: (path, formData) =>
    request(path, { method: "POST", body: formData, isForm: true }),
};

export default api;