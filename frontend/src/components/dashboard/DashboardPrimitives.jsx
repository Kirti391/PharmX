import { SURFACE } from "./dashboardTheme";

/* =========================================================
   PHARMUNIS — DASHBOARD PRIMITIVES
   Small typographic building blocks shared by every panel.
========================================================= */

export function Eyebrow({ children, color = SURFACE.inkMuted }) {
  return (
    <p
      className="workspace-label"
      style={{ color }}
    >
      {children}
    </p>
  );
}

export function PanelHeading({
  eyebrow,
  eyebrowColor = SURFACE.inkMuted,
  title,
  action,
  className = "",
}) {
  return (
    <div
      className={[
        "flex items-end justify-between gap-4",
        className,
      ].join(" ")}
    >
      <div className="min-w-0">
        {eyebrow && <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>}

        <h2
          className="mt-2 font-editorial text-[21px] font-semibold leading-tight"
          style={{ color: SURFACE.ink }}
        >
          {title}
        </h2>
      </div>

      {action}
    </div>
  );
}

export function ScriptLine({
  children,
  color = SURFACE.inkMuted,
  className = "",
}) {
  return (
    <p
      className={[
        "font-script text-[15px] leading-7",
        className,
      ].join(" ")}
      style={{ color }}
    >
      {children}
    </p>
  );
}

export function SectionDivider({ className = "" }) {
  return (
    <div
      className={["h-px w-full", className].join(" ")}
      style={{ backgroundColor: SURFACE.hairline }}
    />
  );
}

export function EmptyRow({ icon: Icon, children }) {
  return (
    <div
      className="flex items-start gap-3 py-4"
      style={{ color: SURFACE.inkMuted }}
    >
      {Icon && <Icon size={16} strokeWidth={1.4} className="mt-0.5" />}

      <p className="font-body text-[11px] leading-5">{children}</p>
    </div>
  );
}
