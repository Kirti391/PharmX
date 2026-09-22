import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-sage text-navy hover:opacity-90 shadow-sm",
  secondary: "bg-tealdeep text-white hover:opacity-90 shadow-sm",
  ghost: "bg-transparent text-navy hover:bg-navy/5 border border-navy/15",
  danger: "bg-red-500 text-white hover:opacity-90",
};
const sizes = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-6 py-3",
};

export const Button = forwardRef(
  ({ variant = "primary", size = "md", loading, className = "", children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all
        disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export function Card({ className = "", children }) {
  return <div className={`bg-white rounded-xl shadow-sm border border-taupedark/10 p-5 ${className}`}>{children}</div>;
}

export function GlassCard({ className = "", children }) {
  return (
    <div
      className={`rounded-xl p-6 ${className}`}
      style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      {children}
    </div>
  );
}

const statusColors = {
  CONFIRMED: "bg-sage/20 text-tealdeep",
  RUNNING_LATE: "bg-amber-100 text-amber-700",
  RESCHEDULE_REQUESTED: "bg-violet-100 text-violet-700",
  CANCELLED: "bg-red-100 text-red-600",
  EMERGENCY: "bg-red-100 text-red-600 animate-pulse",
  COMPLETED: "bg-taupe/15 text-taupedark",
  OPEN: "bg-sage/20 text-tealdeep",
  CLOSED: "bg-taupe/15 text-taupedark",
  FILLED: "bg-taupe/15 text-taupedark",
  MATCHED: "bg-violet-100 text-violet-700",
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-sage/20 text-tealdeep",
  DECLINED: "bg-red-100 text-red-600",
  ACTIVE: "bg-sage/20 text-tealdeep",
  PENDING_VERIFICATION: "bg-amber-100 text-amber-700",
  SUSPENDED: "bg-red-100 text-red-600",
  REJECTED: "bg-red-100 text-red-600",
  APPROVED: "bg-sage/20 text-tealdeep",
};

const statusLabels = {
  PENDING_VERIFICATION: "Pending Verification",
  RUNNING_LATE: "Running Late",
  RESCHEDULE_REQUESTED: "Reschedule Requested",
};

export function StatusBadge({ status }) {
  const classes = statusColors[status] || "bg-taupe/15 text-taupedark";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${classes}`}>
      {statusLabels[status] || status.replaceAll("_", " ")}
    </span>
  );
}

export function Label(props) {
  return <label {...props} className={`block text-sm font-medium text-taupedark mb-1.5 ${props.className || ""}`} />;
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-taupedark/20 px-3.5 py-2.5 text-sm outline-none
        focus:border-sage focus:ring-2 focus:ring-sage/30 transition-all ${props.className || ""}`}
    />
  );
}

export function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-taupedark/20 px-3.5 py-2.5 text-sm outline-none
        focus:border-sage focus:ring-2 focus:ring-sage/30 transition-all resize-none ${props.className || ""}`}
    />
  );
}

export function Select(props) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-taupedark/20 px-3.5 py-2.5 text-sm outline-none bg-white
        focus:border-sage focus:ring-2 focus:ring-sage/30 transition-all ${props.className || ""}`}
    />
  );
}

export function EmptyState({ title, subtitle }) {
  return (
    <div className="text-center py-12 text-taupe">
      <p className="font-display font-medium text-taupedark">{title}</p>
      {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

export function Loader() {
  return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="animate-spin text-sage" size={28} />
    </div>
  );
}
