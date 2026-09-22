import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { http, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui";
import { Input, Label } from "../components/ui";
import { Pill } from "lucide-react";

const ROLE_MAP = {
  "pharma-company": { role: "PHARMA_COMPANY", title: "Pharma Company", nameLabel: "Company name", needsLocation: false },
  mr: { role: "MR", title: "Medical Representative", nameLabel: "Full name", needsLocation: false },
  "independent-mr": { role: "INDEPENDENT_MR", title: "Independent / Freelance MR", nameLabel: "Full name", needsLocation: false },
  pharmacy: { role: "PHARMACY", title: "Pharmacy / Chemist", nameLabel: "Pharmacy name", needsLocation: true },
  stockist: { role: "STOCKIST", title: "Stockist", nameLabel: "Company name", needsLocation: false },
  distributor: { role: "DISTRIBUTOR", title: "Distributor", nameLabel: "Company name", needsLocation: false },
};

export default function SignupFormPage() {
  const { role: roleSlug } = useParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const config = ROLE_MAP[roleSlug];

  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!config) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center text-white">
        <p>
          Unknown role.{" "}
          <Link className="text-sage" to="/signup">
            Go back
          </Link>
        </p>
      </div>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await http.post("/auth/signup", {
        email,
        mobile,
        password,
        role: config.role,
        displayName,
        location: config.needsLocation ? location : undefined,
      });
      setSession(result.user, result.tokens.accessToken, result.tokens.refreshToken);
      navigate("/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-sage flex items-center justify-center">
              <Pill className="text-navy" size={20} />
            </div>
            <span className="font-display font-bold text-xl text-white">PharmX</span>
          </Link>
        </div>
        <div className="rounded-xl p-8 bg-white/5 border border-white/10">
          <h1 className="font-display text-xl font-semibold text-white mb-1">Sign up as {config.title}</h1>
          <p className="text-white/60 text-sm mb-6">Basic details to get started — you can fill in the rest later.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label className="text-white/80">{config.nameLabel}</Label>
              <Input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            {config.needsLocation && (
              <div>
                <Label className="text-white/80">Location (city, state)</Label>
                <Input required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Karnal, Haryana" />
              </div>
            )}
            <div>
              <Label className="text-white/80">Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label className="text-white/80">Mobile number</Label>
              <Input required value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9876543210" />
            </div>
            <div>
              <Label className="text-white/80">Password</Label>
              <Input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>
        </div>
        <p className="text-center text-white/40 text-sm mt-6">
          Wrong role?{" "}
          <Link to="/signup" className="text-sage font-medium">
            Choose again
          </Link>
        </p>
      </div>
    </div>
  );
}
