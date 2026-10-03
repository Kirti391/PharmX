import { Link } from "react-router-dom";
import { BadgeCheck, MapPin } from "lucide-react";

import { initials, pharmacyLocation } from "./dashboardData";

/* =========================================================
   PHARMUNIS — PHARMACY IDENTITY CARD
   Dark card summarising the signed-in pharmacy profile.
========================================================= */

const DARK = {
  background: "#241B3F",
  hairline: "rgba(255,255,255,0.16)",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.55)",
  verified: "#7FD1AE",
};

export function PharmacyProfileCard({
  profile,
  name,
  verified = false,
}) {
  const location = pharmacyLocation(profile);

  return (
    <section
      className="rounded-[16px] px-6 py-7"
      style={{ backgroundColor: DARK.background }}
    >
      <div className="flex items-center gap-3.5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border font-nav text-[13px]"
          style={{
            borderColor: DARK.hairline,
            color: DARK.text,
          }}
        >
          {initials(name)}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className="truncate font-editorial text-[17px] font-semibold"
              style={{ color: DARK.text }}
            >
              {name}
            </h2>

            {verified && (
              <span
                className="inline-flex items-center gap-1 font-nav text-[8px] uppercase tracking-[0.16em]"
                style={{ color: DARK.verified }}
              >
                <BadgeCheck size={11} strokeWidth={2} />
                Verified
              </span>
            )}
          </div>

          <p
            className="mt-1.5 flex items-center gap-1.5 font-body text-[10.5px]"
            style={{ color: DARK.muted }}
          >
            <MapPin size={11} />
            {location || "Location not added yet"}
          </p>
        </div>
      </div>

      <Link
        to="/profile"
        className="
          mt-5 flex h-11 items-center justify-center rounded-xl border
          font-nav text-[9.5px] uppercase tracking-[0.16em] transition-colors
          duration-200 hover:border-white/45 hover:bg-white/5
        "
        style={{ borderColor: DARK.hairline, color: DARK.text }}
      >
        Manage profile
      </Link>
    </section>
  );
}
