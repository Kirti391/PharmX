import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { http, apiErrorMessage } from "../lib/api";
import { Button } from "../components/ui";
import { Input, Label } from "../components/ui";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [resetToken, setResetToken] = useState(search.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await http.post("/auth/reset-password", { resetToken, newPassword });
      setDone(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl p-8 bg-white/5 border border-white/10">
        <h1 className="font-display text-xl font-semibold text-white mb-1">Set a new password</h1>
        <p className="text-white/60 text-sm mb-6">Paste the reset token from your email/dev console and choose a new password.</p>
        {done ? (
          <p className="text-sage text-sm">Password updated — redirecting you to log in…</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label className="text-white/80">Reset token</Label>
              <Input required value={resetToken} onChange={(e) => setResetToken(e.target.value)} />
            </div>
            <div>
              <Label className="text-white/80">New password</Label>
              <Input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              Reset password
            </Button>
          </form>
        )}
        <p className="text-center text-white/40 text-sm mt-6">
          <Link to="/login" className="text-sage font-medium">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
