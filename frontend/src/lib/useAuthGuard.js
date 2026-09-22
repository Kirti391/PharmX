import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { http } from "./api";

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
        const fresh = await http.get("/auth/me");
        if (!cancelled) setUser(fresh);
      } catch {
        clear();
        navigate("/login", { replace: true });
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
