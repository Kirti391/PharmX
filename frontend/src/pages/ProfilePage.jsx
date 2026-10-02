import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  Globe2,
  Languages,
  MapPin,
  MessageSquare,
  PackageSearch,
  Pencil,
  Save,
  ShieldCheck,
  Store,
  Truck,
  Upload,
  UserRound,
} from "lucide-react";

import { http, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import {
  Card,
  Input,
  Label,
  Select,
  TextArea,
  Loader,
} from "../components/ui";
import { Button } from "../components/ui";
import { PRODUCT_CATEGORIES } from "../lib/constants";

const COLORS = {
  primary: "#D83F87",
  navy: "#2A1B3D",
  purple: "#44318D",
  coral: "#E98074",
  muted: "#A4B3B6",
  background: "#F8F7F9",
  border: "#E9E6EC",
};

const PHARMACY_TYPES = [
  "Retail Pharmacy",
  "Community Pharmacy",
  "Hospital Pharmacy",
  "Clinic Pharmacy",
  "Chain Pharmacy",
  "Online Pharmacy",
  "Other",
];

const OWNERSHIP_TYPES = [
  "Proprietorship",
  "Partnership",
  "Private Limited",
  "LLP",
  "Trust",
  "Other",
];

const LICENCE_TYPES = [
  "Retail",
  "Wholesale",
  "Retail & Wholesale",
  "Other",
];

const DEMAND_RANGES = [
  "Small",
  "Medium",
  "Large",
  "Enterprise",
];

const COMMUNICATION_METHODS = [
  "PharmUnis Messages",
  "Phone",
  "Email",
  "WhatsApp",
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function TagInput({ label, values = [], onChange, placeholder, disabled = false }) {
  const [draft, setDraft] = useState("");

  function add() {
    if (disabled) return;

    const value = draft.trim();

    if (value && !values.includes(value)) {
      onChange([...values, value]);
    }

    setDraft("");
  }

  return (
    <div>
      <Label>{label}</Label>

      {values.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-[Fauna_One] text-[10px]"
              style={{
                backgroundColor: "#F1ECFA",
                color: COLORS.navy,
              }}
            >
              {value}

              {!disabled && (
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      values.filter((item) => item !== value)
                    )
                  }
                  className="text-xs transition hover:text-[#D83F87]"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {!disabled && (
        <div className="flex gap-2">
          <Input
            value={draft}
            placeholder={placeholder}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
            }}
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={add}
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

function SaveBar({ saved, error, saving = false, onCancel }) {
  return (
    <div
      className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center"
      style={{ borderColor: COLORS.border }}
    >
      <Button type="submit" loading={saving}>
        <Save size={14} />
        Save changes
      </Button>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border px-4 py-2.5 font-[Unica_One] text-[10px] uppercase tracking-[0.08em]"
          style={{
            borderColor: COLORS.border,
            color: COLORS.navy,
          }}
        >
          Cancel
        </button>
      )}

      {saved && (
        <span
          className="flex items-center gap-1.5 font-[Fauna_One] text-xs"
          style={{ color: "#32734D" }}
        >
          <CheckCircle2 size={14} />
          Saved
        </span>
      )}

      {error && (
        <span
          className="font-[Fauna_One] text-xs"
          style={{ color: COLORS.primary }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="mb-6 flex gap-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{
          backgroundColor: "#FCE8F1",
          color: COLORS.primary,
        }}
      >
        <Icon size={18} />
      </div>

      <div>
        <p
          className="font-[Unica_One] text-[9px] uppercase tracking-[0.18em]"
          style={{ color: COLORS.primary }}
        >
          {eyebrow}
        </p>

        <h2
          className="mt-1 font-[Cinzel] text-base font-semibold"
          style={{ color: COLORS.navy }}
        >
          {title}
        </h2>

        {description && (
          <p
            className="mt-1 max-w-2xl font-[Fauna_One] text-xs leading-5"
            style={{ color: COLORS.muted }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition"
      style={{
        borderColor: checked
          ? COLORS.primary
          : COLORS.border,
        backgroundColor: checked
          ? "#FFF7FA"
          : "#FFFFFF",
        opacity: disabled ? 0.75 : 1,
      }}
    >
      <div>
        <p
          className="font-[Cinzel] text-xs font-semibold"
          style={{ color: COLORS.navy }}
        >
          {label}
        </p>

        {description && (
          <p
            className="mt-1 font-[Fauna_One] text-[10px] leading-4"
            style={{ color: COLORS.muted }}
          >
            {description}
          </p>
        )}
      </div>

      <span
        className="relative h-6 w-11 shrink-0 rounded-full transition"
        style={{
          backgroundColor: checked
            ? COLORS.primary
            : "#D8D4DC",
        }}
      >
        <span
          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all"
          style={{
            left: checked ? "24px" : "4px",
          }}
        />
      </span>
    </button>
  );
}

function profileValue(profile, key, fallback = "") {
  return profile?.[key] ?? fallback;
}

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  if (!user) return <Loader />;

  if (
    user.role === "MR" ||
    user.role === "INDEPENDENT_MR"
  ) {
    return <MRProfileForm />;
  }

  if (user.role === "PHARMA_COMPANY") {
    return <PharmaProfileForm />;
  }

  if (user.role === "PHARMACY") {
    return <PharmacyProfileForm />;
  }

  if (
    user.role === "STOCKIST" ||
    user.role === "DISTRIBUTOR"
  ) {
    return <StockistProfileForm />;
  }

  return (
    <p
      className="font-[Fauna_One] text-sm"
      style={{ color: COLORS.muted }}
    >
      No profile type for this role.
    </p>
  );
}

function MRProfileForm() {
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    http
      .get("/profiles/mr/me")
      .then(setProfile)
      .catch(() => {});
  }, []);

  if (!profile) return <Loader />;

  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const updated = await http.patch(
        "/profiles/mr/me",
        profile
      );

      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(
        apiErrorMessage(err, "Failed to save")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <h1
        className="font-[Cinzel] text-2xl font-semibold"
        style={{ color: COLORS.navy }}
      >
        My MR Profile
      </h1>

      <p
        className="mt-2 font-[Fauna_One] text-xs"
        style={{ color: COLORS.muted }}
      >
        Manage your professional information and territories.
      </p>

      <Card className="mt-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>Full name</Label>
            <Input
              value={profile.fullName}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  fullName: event.target.value,
                })
              }
            />
          </div>

          <div>
            <Label>Bio</Label>
            <TextArea
              rows={3}
              value={profile.bio ?? ""}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  bio: event.target.value,
                })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Experience (years)</Label>
              <Input
                type="number"
                min={0}
                value={profile.experienceYears}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    experienceYears: Number(
                      event.target.value
                    ),
                  })
                }
              />
            </div>

            <div>
              <Label>Work mode</Label>
              <Select
                value={profile.workMode}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    workMode: event.target.value,
                  })
                }
              >
                <option value="FIELD">Field</option>
                <option value="HYBRID">Hybrid</option>
                <option value="REMOTE">Remote</option>
              </Select>
            </div>
          </div>

          <div>
            <Label>Availability</Label>
            <Select
              value={profile.availabilityStatus}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  availabilityStatus: event.target.value,
                })
              }
            >
              <option value="AVAILABLE">Available</option>
              <option value="BUSY">Busy</option>
              <option value="ON_LEAVE">On leave</option>
            </Select>
          </div>

          <TagInput
            label="Languages"
            values={profile.languages}
            onChange={(values) =>
              setProfile({
                ...profile,
                languages: values,
              })
            }
            placeholder="e.g. Hindi"
          />

          <TagInput
            label="Specializations"
            values={profile.specializations}
            onChange={(values) =>
              setProfile({
                ...profile,
                specializations: values,
              })
            }
            placeholder="e.g. Dermatology"
          />

          <TagInput
            label="Preferred territories"
            values={profile.territories}
            onChange={(values) =>
              setProfile({
                ...profile,
                territories: values,
              })
            }
            placeholder="e.g. Karnal, Haryana"
          />

          <div>
            <Label>Companies represented</Label>
            <Input
              value={profile.companiesRepresented ?? ""}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  companiesRepresented:
                    event.target.value,
                })
              }
              placeholder="Free text for MVP"
            />
          </div>

          <SaveBar
            saved={saved}
            error={error}
            saving={saving}
          />
        </form>
      </Card>

      <p
        className="mt-3 font-[Fauna_One] text-[10px]"
        style={{ color: COLORS.muted }}
      >
        Suggested categories:{" "}
        {PRODUCT_CATEGORIES.join(", ")}
      </p>
    </div>
  );
}

function PharmaProfileForm() {
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    http
      .get("/profiles/pharma/me")
      .then(setProfile)
      .catch(() => {});
  }, []);

  if (!profile) return <Loader />;

  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const updated = await http.patch(
        "/profiles/pharma/me",
        profile
      );

      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(
        apiErrorMessage(err, "Failed to save")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <h1
        className="font-[Cinzel] text-2xl font-semibold"
        style={{ color: COLORS.navy }}
      >
        My Company Profile
      </h1>

      <p
        className="mt-2 font-[Fauna_One] text-xs"
        style={{ color: COLORS.muted }}
      >
        Manage your pharmaceutical company presence on PharmUnis.
      </p>

      <Card className="mt-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>Company name</Label>
            <Input
              value={profile.companyName}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  companyName: event.target.value,
                })
              }
            />
          </div>

          <div>
            <Label>Description</Label>
            <TextArea
              rows={3}
              value={profile.description ?? ""}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  description: event.target.value,
                })
              }
            />
          </div>

          <div>
            <Label>Manufacturing location</Label>
            <Input
              value={profile.manufacturingLocation ?? ""}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  manufacturingLocation:
                    event.target.value,
                })
              }
            />
          </div>

          <TagInput
            label="Areas of operation"
            values={profile.areasOfOperation}
            onChange={(values) =>
              setProfile({
                ...profile,
                areasOfOperation: values,
              })
            }
            placeholder="e.g. Haryana"
          />

          <TagInput
            label="Product categories"
            values={profile.productCategories}
            onChange={(values) =>
              setProfile({
                ...profile,
                productCategories: values,
              })
            }
            placeholder="e.g. Dermatology"
          />

          <SaveBar
            saved={saved}
            error={error}
            saving={saving}
          />
        </form>
      </Card>

      <p
        className="mt-3 font-[Fauna_One] text-[10px]"
        style={{ color: COLORS.muted }}
      >
        Suggested categories:{" "}
        {PRODUCT_CATEGORIES.join(", ")}
      </p>
    </div>
  );
}

function PharmacyProfileForm() {
  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    http
      .get("/profiles/pharmacy/me")
      .then((data) => {
        setProfile(data);
        setOriginalProfile(data);
      })
      .catch(() => {});
  }, []);

  if (!profile) return <Loader />;

  function update(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  }

  function toggleDay(day) {
    const days = Array.isArray(profile.noVisitDays)
      ? profile.noVisitDays
      : [];

    update(
      "noVisitDays",
      days.includes(day)
        ? days.filter((item) => item !== day)
        : [...days, day]
    );
  }

  function cancelEditing() {
    setProfile(originalProfile);
    setEditing(false);
    setSaved(false);
    setError(null);
  }

  async function onSubmit(event) {
    event.preventDefault();

    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const updated = await http.patch(
        "/profiles/pharmacy/me",
        profile
      );

      setProfile(updated);
      setOriginalProfile(updated);
      setSaved(true);
      setEditing(false);
    } catch (err) {
      setError(
        apiErrorMessage(err, "Failed to save pharmacy profile")
      );
    } finally {
      setSaving(false);
    }
  }

  const verified =
    profile.businessVerified ||
    profile.verification?.status === "VERIFIED";

  const verificationStatus =
    profile.verification?.status ||
    (profile.businessVerified ? "VERIFIED" : "NOT VERIFIED");

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* HEADER */}
      <section
        className="relative overflow-hidden rounded-[28px] p-6 sm:p-8"
        style={{
          background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.purple})`,
        }}
      >
        <div
          className="absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: COLORS.primary }}
        />

        <div
          className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: COLORS.coral }}
        />

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
              {profile.profileImage ||
              profile.logo ? (
                <img
                  src={profile.profileImage || profile.logo}
                  alt={
                    profile.displayName ||
                    profile.pharmacyName ||
                    "Pharmacy"
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <Store
                  size={25}
                  className="text-white/70"
                />
              )}
            </div>

            <div>
              <p className="font-[Unica_One] text-[9px] uppercase tracking-[0.2em] text-white/45">
                Pharmacy Profile
              </p>

              <h1 className="mt-1 font-[Cinzel] text-2xl font-semibold text-white">
                {profile.displayName ||
                  profile.pharmacyName ||
                  "My Pharmacy"}
              </h1>

              <p className="mt-1 font-[Fauna_One] text-xs text-white/55">
                {profile.pharmacyType ||
                  "Pharmacy"}
                {profile.city
                  ? ` • ${profile.city}`
                  : profile.location
                    ? ` • ${profile.location}`
                    : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {verified && (
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <ShieldCheck
                  size={14}
                  className="text-white/75"
                />

                <span className="font-[Unica_One] text-[9px] uppercase tracking-[0.1em] text-white/65">
                  Verified
                </span>
              </div>
            )}

            {!editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setSaved(false);
                }}
                className="flex items-center gap-2 rounded-xl bg-[#D83F87] px-4 py-2.5 font-[Unica_One] text-[10px] uppercase tracking-[0.08em] text-white transition hover:bg-[#c93679]"
              >
                <Pencil size={14} />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </section>

      {saved && (
        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-3 font-[Fauna_One] text-xs"
          style={{
            borderColor: "#D5E9DF",
            backgroundColor: "#F5FBF7",
            color: "#32734D",
          }}
        >
          <CheckCircle2 size={15} />
          Pharmacy profile updated successfully.
        </div>
      )}

      {error && (
        <div
          className="rounded-xl border px-4 py-3 font-[Fauna_One] text-xs"
          style={{
            borderColor: "#F2D3DE",
            backgroundColor: "#FFF8FA",
            color: COLORS.primary,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* BASIC INFORMATION */}
        <Card className="border-[#E9E6EC] bg-white p-6 sm:p-8">
          <SectionHeader
            icon={Building2}
            eyebrow="Identity"
            title="Basic information"
            description="The information partners see when discovering your pharmacy."
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label>Pharmacy name</Label>
              <Input
                disabled={!editing}
                value={profile.pharmacyName ?? ""}
                onChange={(event) =>
                  update(
                    "pharmacyName",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <Label>Display name</Label>
              <Input
                disabled={!editing}
                value={profile.displayName ?? ""}
                onChange={(event) =>
                  update(
                    "displayName",
                    event.target.value
                  )
                }
                placeholder="Name shown to PharmUnis partners"
              />
            </div>

            <div>
              <Label>Profile image / logo</Label>
              <div className="flex gap-2">
                <Input
                  disabled={!editing}
                  value={
                    profile.profileImage ||
                    profile.logo ||
                    ""
                  }
                  onChange={(event) =>
                    update(
                      "profileImage",
                      event.target.value
                    )
                  }
                  placeholder="Image URL"
                />

                {editing && (
                  <button
                    type="button"
                    className="flex shrink-0 items-center gap-2 rounded-xl border px-3 font-[Unica_One] text-[9px] uppercase tracking-[0.08em]"
                    style={{
                      borderColor: COLORS.border,
                      color: COLORS.navy,
                    }}
                  >
                    <Upload size={14} />
                    Upload
                  </button>
                )}
              </div>
            </div>

            <div>
              <Label>Pharmacy type</Label>
              <Select
                disabled={!editing}
                value={profile.pharmacyType ?? ""}
                onChange={(event) =>
                  update(
                    "pharmacyType",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select pharmacy type
                </option>

                {PHARMACY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <TextArea
                disabled={!editing}
                rows={4}
                value={profile.description ?? ""}
                onChange={(event) =>
                  update(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Describe your pharmacy, customer base and procurement focus..."
              />
            </div>

            <div>
              <Label>Year established</Label>
              <Input
                disabled={!editing}
                type="number"
                value={profile.yearEstablished ?? ""}
                onChange={(event) =>
                  update(
                    "yearEstablished",
                    event.target.value
                  )
                }
                placeholder="e.g. 2018"
              />
            </div>

            <div>
              <Label>Ownership type</Label>
              <Select
                disabled={!editing}
                value={profile.ownershipType ?? ""}
                onChange={(event) =>
                  update(
                    "ownershipType",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select ownership type
                </option>

                {OWNERSHIP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Business hours</Label>
              <Input
                disabled={!editing}
                value={profile.businessHours ?? ""}
                onChange={(event) =>
                  update(
                    "businessHours",
                    event.target.value
                  )
                }
                placeholder="Mon-Sat, 9 AM - 9 PM"
              />
            </div>

            <div>
              <Label>Languages</Label>
              <TagInput
                values={
                  Array.isArray(profile.languages)
                    ? profile.languages
                    : []
                }
                onChange={(values) =>
                  update("languages", values)
                }
                placeholder="e.g. Hindi"
                disabled={!editing}
              />
            </div>
          </div>
        </Card>

        {/* LOCATION */}
        <Card className="border-[#E9E6EC] bg-white p-6 sm:p-8">
          <SectionHeader
            icon={MapPin}
            eyebrow="Location"
            title="Location & service area"
            description="Control how much location information is visible to potential partners."
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label>City</Label>
              <Input
                disabled={!editing}
                value={profile.city ?? ""}
                onChange={(event) =>
                  update("city", event.target.value)
                }
              />
            </div>

            <div>
              <Label>District</Label>
              <Input
                disabled={!editing}
                value={profile.district ?? ""}
                onChange={(event) =>
                  update(
                    "district",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <Label>State</Label>
              <Input
                disabled={!editing}
                value={profile.state ?? ""}
                onChange={(event) =>
                  update("state", event.target.value)
                }
              />
            </div>

            <div>
              <Label>PIN code</Label>
              <Input
                disabled={!editing}
                value={profile.pinCode ?? ""}
                onChange={(event) =>
                  update(
                    "pinCode",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="md:col-span-2">
              <Label>General service area</Label>
              <Input
                disabled={!editing}
                value={profile.serviceArea ?? ""}
                onChange={(event) =>
                  update(
                    "serviceArea",
                    event.target.value
                  )
                }
                placeholder="e.g. Kurukshetra and nearby areas"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Exact address</Label>
              <TextArea
                disabled={!editing}
                rows={3}
                value={profile.exactAddress ?? ""}
                onChange={(event) =>
                  update(
                    "exactAddress",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="md:col-span-2">
              <Toggle
                disabled={!editing}
                checked={Boolean(
                  profile.showExactAddress
                )}
                onChange={(value) =>
                  update(
                    "showExactAddress",
                    value
                  )
                }
                label="Show exact address to connections"
                description="Your general service area can remain visible while the exact address is limited to approved relationships."
              />
            </div>
          </div>
        </Card>

        {/* LEGAL */}
        <Card className="border-[#E9E6EC] bg-white p-6 sm:p-8">
          <SectionHeader
            icon={ShieldCheck}
            eyebrow="Compliance"
            title="Legal & verification"
            description="Maintain the licensing information used for pharmacy verification."
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label>Retail drug licence number</Label>
              <Input
                disabled={!editing}
                value={
                  profile.retailDrugLicenceNumber ??
                  profile.licenceNumber ??
                  ""
                }
                onChange={(event) =>
                  update(
                    "retailDrugLicenceNumber",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <Label>Licence type / category</Label>
              <Select
                disabled={!editing}
                value={profile.licenceType ?? ""}
                onChange={(event) =>
                  update(
                    "licenceType",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select licence category
                </option>

                {LICENCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Licence issue date</Label>
              <Input
                disabled={!editing}
                type="date"
                value={profile.licenceIssueDate ?? ""}
                onChange={(event) =>
                  update(
                    "licenceIssueDate",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <Label>Licence expiry date</Label>
              <Input
                disabled={!editing}
                type="date"
                value={profile.licenceExpiryDate ?? ""}
                onChange={(event) =>
                  update(
                    "licenceExpiryDate",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <Label>State licensing authority</Label>
              <Input
                disabled={!editing}
                value={
                  profile.licensingAuthority ?? ""
                }
                onChange={(event) =>
                  update(
                    "licensingAuthority",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <Label>GSTIN</Label>
              <Input
                disabled={!editing}
                value={profile.gstin ?? ""}
                onChange={(event) =>
                  update(
                    "gstin",
                    event.target.value
                  )
                }
                placeholder="If applicable"
              />
            </div>

            <div className="md:col-span-2">
              <Label>
                Business registration information
              </Label>
              <Input
                disabled={!editing}
                value={
                  profile.businessRegistration ?? ""
                }
                onChange={(event) =>
                  update(
                    "businessRegistration",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <Label>
                Pharmacist / competent person
              </Label>
              <Input
                disabled={!editing}
                value={
                  profile.pharmacistName ?? ""
                }
                onChange={(event) =>
                  update(
                    "pharmacistName",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <Label>Qualification</Label>
              <Input
                disabled={!editing}
                value={
                  profile.pharmacistQualification ?? ""
                }
                onChange={(event) =>
                  update(
                    "pharmacistQualification",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <Label>Registration number</Label>
              <Input
                disabled={!editing}
                value={
                  profile.pharmacistRegistrationNumber ??
                  ""
                }
                onChange={(event) =>
                  update(
                    "pharmacistRegistrationNumber",
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          <div
            className="mt-6 rounded-2xl border p-5"
            style={{
              borderColor: COLORS.border,
              backgroundColor: "#FCFBFD",
            }}
          >
            <div className="flex items-start gap-3">
              <FileCheck2
                size={18}
                className="mt-0.5"
                style={{ color: COLORS.purple }}
              />

              <div>
                <p
                  className="font-[Cinzel] text-xs font-semibold"
                  style={{ color: COLORS.navy }}
                >
                  Verification status
                </p>

                <p
                  className="mt-1 font-[Fauna_One] text-xs"
                  style={{ color: COLORS.muted }}
                >
                  {verificationStatus}
                </p>

                {profile.verification?.lastVerifiedDate && (
                  <p
                    className="mt-2 font-[Fauna_One] text-[10px]"
                    style={{ color: COLORS.muted }}
                  >
                    Last verified:{" "}
                    {profile.verification.lastVerifiedDate}
                  </p>
                )}

                {profile.verification
                  ?.nextVerificationDate && (
                  <p
                    className="mt-1 font-[Fauna_One] text-[10px]"
                    style={{ color: COLORS.muted }}
                  >
                    Next verification:{" "}
                    {
                      profile.verification
                        .nextVerificationDate
                    }
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="font-[Cinzel] text-xs font-semibold"
                  style={{ color: COLORS.navy }}
                >
                  Verification documents
                </p>

                <p
                  className="mt-1 font-[Fauna_One] text-[10px]"
                  style={{ color: COLORS.muted }}
                >
                  Documents are used for verification and
                  are not part of your public profile.
                </p>
              </div>

              {editing && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 font-[Unica_One] text-[9px] uppercase tracking-[0.08em]"
                  style={{ color: COLORS.primary }}
                >
                  <Upload size={13} />
                  Upload
                </button>
              )}
            </div>

            <div
              className="mt-3 flex items-center gap-3 rounded-xl border p-4"
              style={{
                borderColor: COLORS.border,
                backgroundColor: "#FCFBFD",
              }}
            >
              <FileCheck2
                size={17}
                style={{ color: COLORS.purple }}
              />

              <p
                className="font-[Fauna_One] text-xs"
                style={{ color: COLORS.muted }}
              >
                {profile.documents?.length
                  ? `${profile.documents.length} document(s) uploaded`
                  : "No verification documents uploaded yet"}
              </p>
            </div>
          </div>
        </Card>

        {/* PROCUREMENT */}
        <Card className="border-[#E9E6EC] bg-white p-6 sm:p-8">
          <SectionHeader
            icon={PackageSearch}
            eyebrow="Procurement"
            title="Business & procurement preferences"
            description="These preferences help PharmUnis match your pharmacy with relevant supply partners."
          />

          <div className="space-y-5">
            <TagInput
              label="Product categories of interest"
              values={
                Array.isArray(
                  profile.productCategories
                )
                  ? profile.productCategories
                  : Array.isArray(
                        profile.interestedCategories
                      )
                    ? profile.interestedCategories
                    : []
              }
              onChange={(values) =>
                update(
                  "productCategories",
                  values
                )
              }
              placeholder="e.g. Dermatology"
              disabled={!editing}
            />

            <TagInput
              label="Preferred suppliers"
              values={
                Array.isArray(
                  profile.preferredSuppliers
                )
                  ? profile.preferredSuppliers
                  : []
              }
              onChange={(values) =>
                update(
                  "preferredSuppliers",
                  values
                )
              }
              placeholder="e.g. Pharma companies, distributors"
              disabled={!editing}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label>
                  Interest in new companies
                </Label>
                <Select
                  disabled={!editing}
                  value={
                    profile.newCompanyInterest ??
                    "YES"
                  }
                  onChange={(event) =>
                    update(
                      "newCompanyInterest",
                      event.target.value
                    )
                  }
                >
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </Select>
              </div>

              <div>
                <Label>
                  Alternative-brand acceptance
                </Label>
                <Select
                  disabled={!editing}
                  value={
                    profile.alternativeBrandAcceptance ??
                    "YES"
                  }
                  onChange={(event) =>
                    update(
                      "alternativeBrandAcceptance",
                      event.target.value
                    )
                  }
                >
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </Select>
              </div>

              <div>
                <Label>
                  Approximate demand range
                </Label>
                <Select
                  disabled={!editing}
                  value={
                    profile.demandRange ?? ""
                  }
                  onChange={(event) =>
                    update(
                      "demandRange",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select demand range
                  </option>

                  {DEMAND_RANGES.map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>Delivery preferences</Label>
                <Input
                  disabled={!editing}
                  value={
                    profile.deliveryPreferences ??
                    ""
                  }
                  onChange={(event) =>
                    update(
                      "deliveryPreferences",
                      event.target.value
                    )
                  }
                  placeholder="Preferred delivery arrangement"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Toggle
                disabled={!editing}
                checked={Boolean(
                  profile.coldChainRequirement
                )}
                onChange={(value) =>
                  update(
                    "coldChainRequirement",
                    value
                  )
                }
                label="Cold-chain requirement"
                description="Indicate if temperature-controlled supply is required."
              />

              <Toggle
                disabled={!editing}
                checked={Boolean(
                  profile.urgentSupplyRequirement
                )}
                onChange={(value) =>
                  update(
                    "urgentSupplyRequirement",
                    value
                  )
                }
                label="Urgent supply requirement"
                description="Highlight when your pharmacy may require urgent procurement."
              />
            </div>
          </div>
        </Card>

        {/* COMMUNICATION */}
        <Card className="border-[#E9E6EC] bg-white p-6 sm:p-8">
          <SectionHeader
            icon={MessageSquare}
            eyebrow="Communication"
            title="MR & communication preferences"
            description="Control how medical representatives and other partners should approach your pharmacy."
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label>
                Preferred communication method
              </Label>

              <Select
                disabled={!editing}
                value={
                  profile.preferredCommunicationMethod ??
                  "PharmUnis Messages"
                }
                onChange={(event) =>
                  update(
                    "preferredCommunicationMethod",
                    event.target.value
                  )
                }
              >
                {COMMUNICATION_METHODS.map(
                  (method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  )
                )}
              </Select>
            </div>

            <div>
              <Label>
                Preferred MR visit hours
              </Label>

              <Input
                disabled={!editing}
                value={
                  profile.preferredMRVisitHours ??
                  ""
                }
                onChange={(event) =>
                  update(
                    "preferredMRVisitHours",
                    event.target.value
                  )
                }
                placeholder="e.g. 4 PM - 7 PM"
              />
            </div>
          </div>

          <div className="mt-6">
            <Label>
              Days when MR visits are not accepted
            </Label>

            <div className="mt-3 flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const selected = (
                  profile.noVisitDays || []
                ).includes(day);

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={!editing}
                    onClick={() => toggleDay(day)}
                    className="rounded-xl border px-3 py-2 font-[Unica_One] text-[9px] uppercase tracking-[0.06em] transition"
                    style={{
                      borderColor: selected
                        ? COLORS.primary
                        : COLORS.border,
                      backgroundColor: selected
                        ? "#FCE8F1"
                        : "#FFFFFF",
                      color: selected
                        ? COLORS.primary
                        : COLORS.muted,
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* PRIVACY */}
        <Card className="border-[#E9E6EC] bg-white p-6 sm:p-8">
          <SectionHeader
            icon={Globe2}
            eyebrow="Privacy"
            title="Profile visibility"
            description="Keep sensitive pharmacy information under your control."
          />

          <div className="grid gap-3 md:grid-cols-2">
            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: COLORS.border,
                backgroundColor: "#FCFBFD",
              }}
            >
              <div className="flex items-start gap-3">
                <Globe2
                  size={17}
                  style={{ color: COLORS.purple }}
                />

                <div>
                  <p
                    className="font-[Cinzel] text-xs font-semibold"
                    style={{ color: COLORS.navy }}
                  >
                    Public discovery
                  </p>

                  <p
                    className="mt-1 font-[Fauna_One] text-[10px] leading-5"
                    style={{ color: COLORS.muted }}
                  >
                    Basic pharmacy information can be
                    used in discovery and requirement
                    matching.
                  </p>
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: COLORS.border,
                backgroundColor: "#FCFBFD",
              }}
            >
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={17}
                  style={{ color: COLORS.coral }}
                />

                <div>
                  <p
                    className="font-[Cinzel] text-xs font-semibold"
                    style={{ color: COLORS.navy }}
                  >
                    Sensitive information
                  </p>

                  <p
                    className="mt-1 font-[Fauna_One] text-[10px] leading-5"
                    style={{ color: COLORS.muted }}
                  >
                    Licence information, verification
                    documents and exact-address data should
                    remain restricted according to your
                    privacy settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* SAVE */}
        {editing && (
          <SaveBar
            saved={saved}
            error={error}
            saving={saving}
            onCancel={cancelEditing}
          />
        )}
      </form>

      <p
        className="font-[Fauna_One] text-[10px]"
        style={{ color: COLORS.muted }}
      >
        Suggested product categories:{" "}
        {PRODUCT_CATEGORIES.join(", ")}
      </p>
    </div>
  );
}

function StockistProfileForm() {
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    http
      .get("/profiles/stockist/me")
      .then(setProfile)
      .catch(() => {});
  }, []);

  if (!profile) return <Loader />;

  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const updated = await http.patch(
        "/profiles/stockist/me",
        profile
      );

      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(
        apiErrorMessage(err, "Failed to save")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <h1
        className="font-[Cinzel] text-2xl font-semibold"
        style={{ color: COLORS.navy }}
      >
        My{" "}
        {profile.type === "DISTRIBUTOR"
          ? "Distributor"
          : "Stockist"}{" "}
        Profile
      </h1>

      <p
        className="mt-2 font-[Fauna_One] text-xs"
        style={{ color: COLORS.muted }}
      >
        Manage your supply coverage and product availability.
      </p>

      {profile.businessVerified && (
        <div
          className="mt-4 flex items-center gap-2 font-[Fauna_One] text-xs"
          style={{ color: "#32734D" }}
        >
          <CheckCircle2 size={15} />
          Business verified
        </div>
      )}

      <Card className="mt-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>Company name</Label>
            <Input
              value={profile.companyName}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  companyName: event.target.value,
                })
              }
            />
          </div>

          <TagInput
            label="Service areas"
            values={profile.serviceAreas}
            onChange={(values) =>
              setProfile({
                ...profile,
                serviceAreas: values,
              })
            }
            placeholder="e.g. Haryana"
          />

          <TagInput
            label="Product categories"
            values={profile.productCategories}
            onChange={(values) =>
              setProfile({
                ...profile,
                productCategories: values,
              })
            }
            placeholder="e.g. Dermatology"
          />

          <TagInput
            label="Associated companies"
            values={profile.associatedCompanies}
            onChange={(values) =>
              setProfile({
                ...profile,
                associatedCompanies: values,
              })
            }
            placeholder="Free text for MVP"
          />

          <SaveBar
            saved={saved}
            error={error}
            saving={saving}
          />
        </form>
      </Card>

      <p
        className="mt-3 font-[Fauna_One] text-[10px]"
        style={{ color: COLORS.muted }}
      >
        Suggested categories:{" "}
        {PRODUCT_CATEGORIES.join(", ")}
      </p>
    </div>
  );
}