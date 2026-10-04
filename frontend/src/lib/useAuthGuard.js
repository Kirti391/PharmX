import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { http } from "./api";

let currentUserRequest = null;

function getCurrentUser(accessToken) {
  if (currentUserRequest?.accessToken === accessToken) {
    return currentUserRequest.promise;
  }

  const promise = http.get("/auth/me").finally(() => {
    if (currentUserRequest?.promise === promise) {
      currentUserRequest = null;
    }
  });
  currentUserRequest = { accessToken, promise };

  return promise;
}

export function useAuthGuard() {
  const navigate = useNavigate();
  const { user, accessToken, setUser, clear } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!accessToken) {
        navigate("/login", { replace: true });
        return;
      }
      try {
        const fresh = await getCurrentUser(accessToken);
        if (!cancelled) setUser(fresh);
      } catch {
        if (!cancelled) {
          clear();
          navigate("/login", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return { user, loading };
}
