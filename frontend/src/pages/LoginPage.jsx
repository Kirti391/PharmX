import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { http, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui";
import { Input, Label } from "../components/ui";
import { Pill } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await http.post("/auth/login", { email, password });
      setSession(result.user, result.tokens.accessToken, result.tokens.refreshToken);
      navigate(result.user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-sage flex items-center justify-center">
              <Pill className="text-navy" size={20} />
            </div>
            <span className="font-display font-bold text-xl text-white">PharmX</span>
          </Link>
        </div>
        <div className="rounded-xl p-8 bg-white/5 border border-white/10">
          <h1 className="font-display text-xl font-semibold text-white mb-1">Welcome back</h1>
          <p className="text-white/60 text-sm mb-6">Log in to your PharmX dashboard.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label className="text-white/80">Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div>
              <Label className="text-white/80">Password</Label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              Log in
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-white/60">
            New to PharmX?{" "}
            <Link to="/signup" className="text-sage font-medium">
              Create an account
            </Link>
          </div>
          <div className="mt-3 text-center">
            <Link to="/forgot-password" className="text-xs text-white/40 hover:text-white/60">
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-xl p-4 bg-white/5 border border-white/10 text-xs text-white/50">
          <p className="font-medium text-white/70 mb-1">Demo accounts (password: Password123!)</p>
          <p>company1@pharmx.dev · mr1@pharmx.dev · pharmacy1@pharmx.dev</p>
          <p>stockist1@pharmx.dev · admin@pharmx.dev</p>
        </div>
      </div>
    </div>
  );
}
