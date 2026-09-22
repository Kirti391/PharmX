import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

export const api = axios.create({ baseURL: API_URL });

// Attach the access token to every outgoing request.
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const { refreshToken, setAccessToken, clear } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const tokens = res.data.data.tokens;
    setAccessToken(tokens.accessToken);
    useAuthStore.setState({ refreshToken: tokens.refreshToken });
    return tokens.accessToken;
  } catch {
    clear();
    return null;
  }
}

// On a 401 (and only once per request), try to silently refresh and retry.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshPromise) refreshPromise = refreshAccessToken().finally(() => (refreshPromise = null));
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

/** Pulls the friendly message out of our backend's { success, data, error } envelope. */
export function apiErrorMessage(err, fallback = "Something went wrong") {
  return err?.response?.data?.error?.message || fallback;
}

/**
 * Thin convenience wrappers that unwrap our backend's { success, data, error, meta }
 * envelope automatically, so page components can just do `await http.get("/foo")`
 * and get the real payload back directly.
 */
export const http = {
  get: (url, config) => api.get(url, config).then((r) => r.data.data),
  post: (url, body, config) => api.post(url, body, config).then((r) => r.data.data),
  patch: (url, body, config) => api.patch(url, body, config).then((r) => r.data.data),
  delete: (url, config) => api.delete(url, config).then((r) => r.data.data),
};

export { API_URL };
