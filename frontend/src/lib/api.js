import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
});

//
// Attach access token
//
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();

    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

async function refreshAccessToken() {
  const { refreshToken, setAccessToken, clear } =
    useAuthStore.getState();

  if (!refreshToken) {
    console.warn("[AUTH] No refresh token available.");
    clear();
    return null;
  }

  try {
    console.log("[AUTH] Access token expired. Refreshing...");

    const res = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken,
    });

    const tokens = res?.data?.data?.tokens;

    if (!tokens?.accessToken) {
      console.error(
        "[AUTH] Refresh succeeded but no access token was returned.",
        res?.data
      );

      clear();
      return null;
    }

    setAccessToken(tokens.accessToken);

    if (tokens.refreshToken) {
      useAuthStore.setState({
        refreshToken: tokens.refreshToken,
      });
    }

    console.log("[AUTH] Access token refreshed.");

    return tokens.accessToken;
  } catch (error) {
    console.error(
      "[AUTH] Refresh failed:",
      error?.response?.data || error?.message
    );

    clear();

    return null;
  }
}

//
// Response interceptor
//
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config;

    const status = error?.response?.status;

    //
    // Only refresh on 401.
    //
    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/refresh")
    ) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;

      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;

        return api(original);
      }
    }

    console.error("[API ERROR]", {
      method: original?.method?.toUpperCase(),
      url: original?.url,
      status,
      response: error?.response?.data,
    });

    //
    // IMPORTANT:
    // Do NOT redirect to "/" here.
    //
    // Let the page receive the actual 401/403 error.
    // This makes debugging and proper UI error handling possible.
    //
    return Promise.reject(error);
  }
);

//
// Backend error helper
//
export function apiErrorMessage(
  err,
  fallback = "Something went wrong"
) {
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

//
// API wrappers
//
// Backend responses look like:
//
// {
//   success: true,
//   data: {...},
//   error: null
// }
//
// These functions return `data` directly.
//
export const http = {
  get: (url, config) =>
    api.get(url, config).then((response) => response.data.data),

  post: (url, body, config) =>
    api.post(url, body, config).then((response) => response.data.data),

  patch: (url, body, config) =>
    api.patch(url, body, config).then((response) => response.data.data),

  delete: (url, config) =>
    api.delete(url, config).then((response) => response.data.data),
};

export { API_URL };