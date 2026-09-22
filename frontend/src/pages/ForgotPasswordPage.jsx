import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { http } from "../lib/api";
import { Button } from "../components/ui";
import { Input, Label } from "../components/ui";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await http.post("/auth/forgot-password", { email });
      setSent(true);
      if (result.devResetToken) {
        setTimeout(() => navigate(`/reset-password?token=${result.devResetToken}`), 1200);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl p-8 bg-white/5 border border-white/10">
        <h1 className="font-display text-xl font-semibold text-white mb-1">Reset your password</h1>
        <p className="text-white/60 text-sm mb-6">Enter your account email and we'll send you a reset link.</p>
        {sent ? (
          <p className="text-sage text-sm">
            If an account exists for that email, a reset link has been sent.{" "}
            <span className="text-white/40">(Dev mode redirects you automatically.)</span>
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label className="text-white/80">Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              Send reset link
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
