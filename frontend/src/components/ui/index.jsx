import { forwardRef } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

const variants = {
  primary: "bg-primary text-white hover:bg-[#c93679] shadow-sm",
  secondary: "bg-purple text-white hover:bg-[#382778] shadow-sm",
  ghost: "bg-transparent text-navy hover:bg-[#F8F2F5] border border-[#E9E2EA]",
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
  return (
    <div
      className={`rounded-[20px] border border-[#E9E2EA] bg-white p-5 shadow-[0_8px_26px_rgba(42,27,61,0.045)] ${className}`}
    >
      {children}
    </div>
  );
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
  REQUESTED: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-[#EFEBF9] text-purple",
  RUNNING_LATE: "bg-amber-100 text-amber-700",
  RESCHEDULE_REQUESTED: "bg-violet-100 text-violet-700",
  CANCELLED: "bg-red-100 text-red-600",
  EMERGENCY: "bg-red-100 text-red-600 animate-pulse",
  COMPLETED: "bg-[#EDF6F0] text-[#32734D]",
  OPEN: "bg-[#F8F2F5] text-primary",
  CLOSED: "bg-[#F1EEF2] text-[#6E6658]",
  FILLED: "bg-[#F1EEF2] text-[#6E6658]",
  MATCHED: "bg-violet-100 text-violet-700",
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-[#EDF6F0] text-[#32734D]",
  DECLINED: "bg-red-100 text-red-600",
  ACTIVE: "bg-[#EDF6F0] text-[#32734D]",
  PENDING_VERIFICATION: "bg-amber-100 text-amber-700",
  SUSPENDED: "bg-red-100 text-red-600",
  REJECTED: "bg-red-100 text-red-600",
  APPROVED: "bg-[#EDF6F0] text-[#32734D]",
};

const statusLabels = {
  REQUESTED: "Awaiting Doctor",
  PENDING_VERIFICATION: "Pending Verification",
  RUNNING_LATE: "Running Late",
  RESCHEDULE_REQUESTED: "Reschedule Requested",
};

export function StatusBadge({ status }) {
  const classes = statusColors[status] || "bg-[#EFEBF9] text-purple";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${classes}`}>
      {statusLabels[status] || status.replaceAll("_", " ")}
    </span>
  );
}

export function Label(props) {
  return <label {...props} className={`mb-1.5 block text-sm font-medium text-navy ${props.className || ""}`} />;
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-[#E5DEE7] bg-white px-3.5 py-2.5 text-sm text-navy outline-none
        transition-all placeholder:text-[#9A929F] focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F8F6F8] disabled:text-[#77707D] ${props.className || ""}`}
    />
  );
}

export function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`w-full resize-none rounded-xl border border-[#E5DEE7] bg-white px-3.5 py-2.5 text-sm text-navy outline-none
        transition-all placeholder:text-[#9A929F] focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F8F6F8] disabled:text-[#77707D] ${props.className || ""}`}
    />
  );
}

export function Select(props) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-[#E5DEE7] bg-white px-3.5 py-2.5 text-sm text-navy outline-none
        transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F8F6F8] disabled:text-[#77707D] ${props.className || ""}`}
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

export function ErrorState({
  title = "Unable to load this page",
  message,
  onRetry,
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-[#F1D8D0] bg-[#FCF4F0] p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          size={18}
          className="mt-0.5 shrink-0 text-[#B9534B]"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-medium text-[#2A1B3D]">{title}</h2>
          {message && (
            <p className="mt-1 text-sm leading-6 text-[#6E6658]">{message}</p>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#E98074]/30 bg-white px-3 py-2 text-sm font-medium text-[#44318D] transition-colors hover:bg-[#F7F5FA]"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
