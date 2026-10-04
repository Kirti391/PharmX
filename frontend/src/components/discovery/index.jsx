import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "../ui";
import { http, apiErrorMessage } from "../../lib/api";

const TABS = [
  { href: "/discover/companies", label: "Pharma Companies" },
  { href: "/discover/mrs", label: "Medical Reps" },
  { href: "/discover/pharmacies", label: "Pharmacies" },
  { href: "/discover/stockists", label: "Stockists & Distributors" },
];

export function DiscoverTabs() {
  const location = useLocation();
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-[#E9E2EA] bg-white p-1.5 pb-2 shadow-[0_4px_16px_rgba(42,27,61,0.03)]">
      {TABS.map((t) => (
        <Link
          key={t.href}
          to={t.href}
          className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
            location.pathname === t.href ? "bg-primary text-white shadow-sm" : "text-[#6E6658] hover:bg-[#FCFAF8] hover:text-navy"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export function ConnectButton({ recipientUserId }) {
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState(null);

  async function connect() {
    setState("loading");
    try {
      await http.post("/connections", { recipientId: recipientUserId });
      setState("sent");
    } catch (err) {
      setState("error");
      setMessage(apiErrorMessage(err, "Failed to send request"));
    }
  }

  if (state === "sent") return <span className="text-tealdeep text-sm font-medium">Request sent ✓</span>;
  if (state === "error") return <span className="text-red-500 text-xs">{message}</span>;

  return (
    <Button size="sm" variant="secondary" onClick={connect} loading={state === "loading"}>
      Connect
    </Button>
  );
}
