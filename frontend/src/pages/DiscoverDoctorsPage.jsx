import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, CalendarClock, MapPin, Video } from "lucide-react";

import { apiErrorMessage, http } from "../lib/api";
import { PRODUCT_CATEGORIES } from "../lib/constants";
import { Card, Input, Loader, Select } from "../components/ui";

export default function DiscoverDoctorsPage() {
  const [doctors, setDoctors] = useState(null);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();

    if (category) params.set("category", category);

    http
      .get(`/discover/doctors?${params.toString()}`)
      .then((response) => {
        if (active) setDoctors(Array.isArray(response) ? response : []);
      })
      .catch((requestError) => {
        if (!active) return;

        setError(
          apiErrorMessage(
            requestError,
            "Unable to load doctors accepting professional requests."
          )
        );
        setDoctors([]);
      });

    return () => {
      active = false;
    };
  }, [category]);

  const visibleDoctors = (doctors || []).filter((doctor) =>
    [
      doctor.fullName,
      doctor.specialty,
      doctor.subspecialty,
      doctor.clinicHospitalAffiliation,
      doctor.location,
      ...(doctor.professionalInterests || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="rounded-[22px] border border-[#E9E2EA] bg-white p-5 shadow-[0_8px_28px_rgba(42,27,61,0.04)] sm:p-7">
        <p className="font-nav text-[10px] uppercase tracking-[0.2em] text-[#D83F87]">
          Consent-based professional communication
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-navy sm:text-3xl">
          Doctors accepting requests
        </h1>
        <p className="mt-2 max-w-2xl font-body text-xs leading-6 text-[#6E6658]">
          Only verified doctors who have opted in for your account type are listed. Every request must include its category and professional purpose.
        </p>
      </header>

      <div className="grid gap-3 rounded-[20px] border border-[#E9E2EA] bg-white p-4 shadow-[0_6px_22px_rgba(42,27,61,0.03)] sm:grid-cols-[minmax(0,1fr)_260px] sm:p-5">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search specialty, location, or interests"
          aria-label="Search doctors"
        />
        <Select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter doctors by therapeutic category"
        >
          <option value="">All accepted categories</option>
          {PRODUCT_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {!doctors ? (
        <Loader />
      ) : visibleDoctors.length === 0 ? (
        <Card className="py-10 text-center">
          <p className="font-display text-lg font-semibold text-navy">
            No opted-in doctors found
          </p>
          <p className="mt-2 font-body text-sm text-[#6E6658]">
            Try another category or location. Doctors appear here only after registration verification and explicit opt-in.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleDoctors.map((doctor) => {
            const purposeCategory =
              category ||
              doctor.acceptedCategories?.[0] ||
              doctor.specialty;
            const appointmentUrl = new URLSearchParams({
              with: doctor.userId,
              category: purposeCategory || "",
            });

            return (
              <Card key={doctor.id} className="flex flex-col transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(42,27,61,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-navy">
                      {doctor.fullName}
                    </h2>
                    <p className="mt-1 font-body text-sm text-[#6E6658]">
                      {[doctor.specialty, doctor.subspecialty]
                        .filter(Boolean)
                        .join(" · ") || "Registered medical practitioner"}
                    </p>
                    {doctor.companyName && (
                      <p className="mt-2 font-body text-xs font-medium text-purple">
                        Authorized company: {doctor.companyName}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#EDF6F0] px-2.5 py-1 font-nav text-[9px] uppercase tracking-wider text-[#32734D]">
                    <BadgeCheck size={12} />
                    Verified & opted in
                  </span>
                </div>

                <div className="mt-4 space-y-2 font-body text-xs text-taupe">
                  {doctor.clinicHospitalAffiliation && (
                    <p>{doctor.clinicHospitalAffiliation}</p>
                  )}
                  {doctor.location && (
                    <p className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      {doctor.location}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <CalendarClock size={13} />
                    {doctor.appointmentDurationMinutes} minute meetings
                    {doctor.communicationModes?.includes("VIDEO") && (
                      <>
                        <Video size={13} className="ml-2" />
                        Video available
                      </>
                    )}
                  </p>
                </div>

                {doctor.acceptedCategories?.length > 0 && (
                  <p className="mt-4 font-body text-xs leading-5 text-taupe">
                    Accepts: {doctor.acceptedCategories.join(", ")}
                  </p>
                )}

                <div className="mt-auto pt-5">
                  <Link to={`/appointments?${appointmentUrl.toString()}`}>
                    <span className="flex min-h-10 items-center justify-center rounded-full bg-primary px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#c93679]">
                      Request professional appointment
                    </span>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
