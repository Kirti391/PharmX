import { Link } from "react-router-dom";
import { ArrowUpRight, BadgeCheck, MapPin } from "lucide-react";

import { SURFACE } from "./dashboardTheme";
import { initials, pharmacyLocation } from "./dashboardData";

export function PharmacyProfileCard({
  profile,
  name,
  verified = false,
}) {
  const location = pharmacyLocation(profile);

  return (
    <section
      className="relative isolate overflow-hidden rounded-[22px] border px-5 py-6 shadow-[0_10px_30px_rgba(42,27,61,0.045)] sm:px-6"
      style={{
        borderColor: SURFACE.hairline,
        background: "linear-gradient(145deg, #FFFFFF 0%, #FFF9FC 100%)",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute -right-7 -top-9 -z-10 h-28 w-28 rounded-full"
        style={{ backgroundColor: SURFACE.pinkSoft }}
      />
      <div className="flex items-center gap-3.5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] font-nav text-[13px] text-white shadow-sm"
          style={{
            background: `linear-gradient(145deg, ${SURFACE.pink} 0%, ${SURFACE.purple} 100%)`,
          }}
        >
          {initials(name)}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className="truncate font-editorial text-[17px] font-semibold"
              style={{ color: SURFACE.ink }}
            >
              {name}
            </h2>

            {verified && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-nav text-[8px] uppercase tracking-[0.12em]"
                style={{ backgroundColor: SURFACE.successSoft, color: SURFACE.success }}
              >
                <BadgeCheck size={11} strokeWidth={2} />
                Verified
              </span>
            )}
          </div>

          <p
            className="mt-1.5 flex items-center gap-1.5 font-body text-[10.5px]"
            style={{ color: SURFACE.inkMuted }}
          >
            <MapPin size={11} />
            {location || "Location not added yet"}
          </p>
        </div>
      </div>

      <Link
        to="/profile"
        className="group mt-5 flex h-10 items-center justify-between rounded-xl border bg-white/80 px-4 font-nav text-[9px] uppercase tracking-[0.13em] transition-all hover:-translate-y-0.5 hover:shadow-sm"
        style={{ borderColor: SURFACE.hairline, color: SURFACE.inkSoft }}
      >
        Manage profile
        <ArrowUpRight
          size={14}
          className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          style={{ color: SURFACE.pink }}
        />
      </Link>
    </section>
  );
}
