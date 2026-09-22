import { Link } from "react-router-dom";
import { Building2, Users, UserCheck, Store, Truck, Boxes, Pill } from "lucide-react";

const ROLES = [
  { role: "pharma-company", label: "Pharma Company", desc: "Manufacture and distribute pharmaceutical products.", icon: Building2 },
  { role: "mr", label: "Medical Representative", desc: "Represent one or more pharma companies in the field.", icon: Users },
  { role: "independent-mr", label: "Independent / Freelance MR", desc: "Work flexibly across companies and territories.", icon: UserCheck },
  { role: "pharmacy", label: "Pharmacy / Chemist", desc: "Run a pharmacy and want better supplier connections.", icon: Store },
  { role: "stockist", label: "Stockist", desc: "Stock and supply pharmaceutical products regionally.", icon: Boxes },
  { role: "distributor", label: "Distributor", desc: "Distribute pharmaceutical products across territories.", icon: Truck },
];

export default function SignupRoleSelectPage() {
  return (
    <div className="min-h-screen bg-navy px-4 py-12">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-lg bg-sage flex items-center justify-center">
            <Pill className="text-navy" size={20} />
          </div>
          <span className="font-display font-bold text-xl text-white">PharmX</span>
        </Link>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">How will you use PharmX?</h1>
        <p className="text-white/60">Pick the role that best describes you — you can complete your full profile after signup.</p>
      </div>
      <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ROLES.map((r) => (
          <Link
            key={r.role}
            to={`/signup/${r.role}`}
            className="rounded-xl p-6 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
          >
            <r.icon className="text-sage mb-3" size={26} />
            <h3 className="font-display font-semibold text-white mb-1 group-hover:text-sage transition-colors">{r.label}</h3>
            <p className="text-white/50 text-sm">{r.desc}</p>
          </Link>
        ))}
      </div>
      <p className="text-center text-white/40 text-sm mt-8">
        Already have an account?{" "}
        <Link to="/login" className="text-sage font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
