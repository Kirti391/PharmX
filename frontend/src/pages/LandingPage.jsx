import { Link } from "react-router-dom";
import { Building2, Users, Store, Truck, ArrowRight, Pill, Network } from "lucide-react";

const AUDIENCES = [
  { icon: Building2, title: "Pharma Companies", desc: "Find experienced MRs, enter new territories, and discover authorized stockists." },
  { icon: Users, title: "Medical Representatives", desc: "Fewer wasted visits, smarter scheduling, and visibility for independent MRs." },
  { icon: Store, title: "Pharmacies & Chemists", desc: "Post requirements and get matched with the right companies, MRs, and suppliers." },
  { icon: Truck, title: "Stockists & Distributors", desc: "See real pharmacy demand and connect with pharma companies looking for coverage." },
];

function EcosystemIllustration() {
  // Original abstract illustration (molecule / network motif) — no stock imagery,
  // matches the brief's "abstract network, not literal medical clipart" guidance.
  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-md mx-auto" aria-hidden="true">
      <circle cx="200" cy="60" r="30" fill="#88BDBC" />
      <circle cx="80" cy="160" r="26" fill="#254E58" />
      <circle cx="320" cy="160" r="26" fill="#254E58" />
      <circle cx="140" cy="250" r="22" fill="#6E6658" />
      <circle cx="260" cy="250" r="22" fill="#6E6658" />
      <g stroke="#88BDBC" strokeWidth="2" opacity="0.6">
        <line x1="200" y1="60" x2="80" y2="160" />
        <line x1="200" y1="60" x2="320" y2="160" />
        <line x1="80" y1="160" x2="140" y2="250" />
        <line x1="320" y1="160" x2="260" y2="250" />
        <line x1="140" y1="250" x2="260" y2="250" />
        <line x1="80" y1="160" x2="320" y2="160" />
      </g>
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy text-white">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-sage flex items-center justify-center">
            <Pill className="text-navy" size={20} />
          </div>
          <span className="font-display font-bold text-xl">PharmX</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-white/80 hover:text-white px-4 py-2">
            Log in
          </Link>
          <Link to="/signup" className="text-sm bg-sage text-navy font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
            Get Started
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-12 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-sage bg-sage/10 rounded-full px-3 py-1.5 mb-6">
          <Network size={14} /> The digital pharma ecosystem network
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
          Where the entire pharma ecosystem
          <br /> finally <span className="text-sage">connects</span>.
        </h1>
        <p className="text-white/70 text-lg max-w-2xl mx-auto mb-10">
          PharmX links Pharma Companies, Medical Representatives, Stockists/Distributors, and
          Pharmacies in one professional network — for discovery, appointments, demand generation,
          and authorized supply connections.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/signup"
            className="bg-sage text-navy font-semibold px-6 py-3.5 rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            Join the network <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="border border-white/20 px-6 py-3.5 rounded-lg hover:bg-white/5 transition-colors">
            I already have an account
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6">
        <EcosystemIllustration />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {AUDIENCES.map((a) => (
          <div key={a.title} className="rounded-xl p-6 bg-white/5 border border-white/10">
            <a.icon className="text-sage mb-4" size={28} />
            <h3 className="font-display font-semibold text-lg mb-2">{a.title}</h3>
            <p className="text-white/60 text-sm leading-relaxed">{a.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-white/40 text-sm">
        © {new Date().getFullYear()} PharmX. Built for the pharmaceutical B2B ecosystem.
      </footer>
    </div>
  );
}
