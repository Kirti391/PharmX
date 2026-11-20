import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  BadgeCheck,
  CheckCircle2,
  FileCheck2,
  Globe2,
  MapPin,
  MessageSquare,
  PackageSearch,
  Pencil,
  Save,
  ShieldCheck,
  Stethoscope,
  Upload,
} from "lucide-react";

import { http, api, apiErrorMessage, API_URL } from "../lib/api";
import { announceProfileImageUpdated } from "../lib/profileImageEvents";
import { useAuthStore } from "../store/authStore";
import {
  Card,
  ErrorState,
  Input,
  Label,
  Select,
  TextArea,
  Loader,
  StatusBadge,
} from "../components/ui";
import { Button } from "../components/ui";
import { PRODUCT_CATEGORIES } from "../lib/constants";

const COLORS = {
  primary: "#D83F87",
  navy: "#2A1B3D",
  purple: "#44318D",
  coral: "#E98074",
  muted: "#7D7582",
  background: "#F8F7F9",
  border: "#E9E6EC",
};

function isCompanyVerified(company) {
  return (
    company.businessVerified &&
    company.verificationStatus === "VERIFIED"
  );
}

function companyVerificationLabel(company) {
  if (isCompanyVerified(company)) return "";
  if (company.verificationStatus === "PENDING") return "Verification pending";
  if (company.verificationStatus === "REJECTED") return "Verification needs attention";
  if (company.verificationStatus === "EXPIRED") return "Verification expired";
  return "Not verified";
}

function getSafeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : "";
  } catch {
    return "";
  }
}

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

const MR_SAFETY_PREFERENCES = [
  ["DAYTIME_MEETINGS", "Prefer daytime meetings"],
  ["PUBLIC_MEETING_PLACES", "Use public places for in-person meetings"],
  ["VIRTUAL_FIRST", "Prefer virtual meetings when practical"],
  ["NO_OVERNIGHT_TRAVEL", "No overnight work travel"],
  ["PREARRANGED_TRANSPORT", "Arrange transport before out-of-area visits"],
];

const MR_OPPORTUNITY_PREFERENCES = [
  ["MR_HIRING", "MR hiring"],
  ["TERRITORY_EXPANSION", "Territory expansion"],
  ["PRODUCT_PROMOTION", "Product promotion"],
  ["DISTRIBUTION", "Distribution"],
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

function getProfileInitials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0].toUpperCase()).join("") || "?";
}

function ProfileAvatar({ name, imageUrl, large = false }) {
  const [failedImageUrl, setFailedImageUrl] = useState(null);
  const showImage = imageUrl && imageUrl !== failedImageUrl;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#D83F87] to-[#44318D] font-[Philosopher] text-white shadow-sm ${
        large ? "h-16 w-16 text-lg" : "h-14 w-14 text-base"
      }`}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        getProfileInitials(name)
      )}
    </div>
  );
}

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

function getTimeParts(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value || "");
  if (!match) return { hour: "", minute: "00", period: "AM" };

  const hour24 = Number(match[1]);
  return {
    hour: String(hour24 % 12 || 12),
    minute: match[2],
    period: hour24 >= 12 ? "PM" : "AM",
  };
}

function formatTime12Hour(value) {
  const parts = getTimeParts(value);
  return parts.hour ? `${parts.hour}:${parts.minute} ${parts.period}` : "";
}

function TimeInput12Hour({ value, onChange, label, disabled = false }) {
  const [parts, setParts] = useState(() => getTimeParts(value));

  useEffect(() => {
    setParts(getTimeParts(value));
  }, [value]);

  function updatePart(field, selectedValue) {
    const next = { ...parts, [field]: selectedValue };
    setParts(next);
    if (!next.hour) {
      onChange("");
      return;
    }

    const hour12 = Number(next.hour);
    const hour24 = (hour12 % 12) + (next.period === "PM" ? 12 : 0);
    onChange(
      `${String(hour24).padStart(2, "0")}:${next.minute}`
    );
  }

  return (
    <div className="grid grid-cols-[1fr_1.2fr_1fr] gap-1">
      <Select
        aria-label={`${label} hour`}
        disabled={disabled}
        value={parts.hour}
        onChange={(event) => updatePart("hour", event.target.value)}
        className="px-2 text-xs"
      >
        <option value="">Hour</option>
        {Array.from({ length: 12 }, (_, index) => String(index + 1)).map(
          (hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          )
        )}
      </Select>
      <Select
        aria-label={`${label} minute`}
        disabled={disabled}
        value={parts.minute}
        onChange={(event) => updatePart("minute", event.target.value)}
        className="px-2 text-xs"
      >
        {Array.from({ length: 60 }, (_, minute) =>
          String(minute).padStart(2, "0")
        ).map((minute) => (
          <option key={minute} value={minute}>
            {minute}
          </option>
        ))}
      </Select>
      <Select
        aria-label={`${label} AM or PM`}
        disabled={disabled}
        value={parts.period}
        onChange={(event) => updatePart("period", event.target.value)}
        className="px-2 text-xs"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </Select>
    </div>
  );
}

function WeeklyScheduleEditor({
  values = [],
  onChange,
  disabled = false,
  businessHours = false,
}) {
  const rows = Array.isArray(values) ? values : [];
  const startField = businessHours ? "open" : "start";
  const endField = businessHours ? "close" : "end";

  function updateDay(day, field, value) {
    const current =
      rows.find((row) => row.day === day) || {
        day,
        [startField]: "",
        [endField]: "",
        ...(businessHours ? { closed: false } : {}),
      };
    const updated = { ...current, [field]: value };
    const hasSchedule =
      updated.closed ||
      updated[startField] ||
      updated[endField];
    const next = rows.filter((row) => row.day !== day);

    if (hasSchedule) next.push(updated);
    onChange(next);
  }

  if (disabled) {
    return (
      <div className="space-y-1 text-sm text-navy">
        {rows.length ? (
          rows.map((row) => (
            <p key={row.day}>
              {row.day}:{" "}
              {businessHours && row.closed
                ? "Closed"
                : `${formatTime12Hour(row[startField]) || "—"} to ${formatTime12Hour(row[endField]) || "—"}`}
            </p>
          ))
        ) : (
          <p className="text-sm text-[#9A929F]">No schedule added</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {DAYS.map((day) => {
        const row = rows.find((item) => item.day === day) || {};

        return (
          <div
            key={day}
            className="grid items-center gap-2 sm:grid-cols-[100px_1fr_1fr_auto]"
          >
            <span className="text-sm text-navy">{day}</span>
            <TimeInput12Hour
              label={`${day} ${businessHours ? "opening time" : "visit start"}`}
              disabled={Boolean(businessHours && row.closed)}
              value={row[startField] || ""}
              onChange={(value) => updateDay(day, startField, value)}
            />
            <TimeInput12Hour
              label={`${day} ${businessHours ? "closing time" : "visit end"}`}
              disabled={Boolean(businessHours && row.closed)}
              value={row[endField] || ""}
              onChange={(value) => updateDay(day, endField, value)}
            />
            {businessHours && (
              <label className="flex items-center gap-2 text-xs text-[#6E6658]">
                <input
                  type="checkbox"
                  checked={Boolean(row.closed)}
                  onChange={(event) =>
                    updateDay(day, "closed", event.target.checked)
                  }
                />
                Closed
              </label>
            )}
          </div>
        );
      })}
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
          className="rounded-xl border px-4 py-2.5 font-[Philosopher] text-[10px] uppercase tracking-[0.08em]"
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
    <div className="mb-6 flex gap-4 border-b pb-5" style={{ borderColor: COLORS.border }}>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: "#F8F2F5",
          color: COLORS.purple,
        }}
      >
        <Icon size={18} />
      </div>

      <div>
        <p
          className="font-[Philosopher] text-[9px] uppercase tracking-[0.18em]"
          style={{ color: COLORS.primary }}
        >
          {eyebrow}
        </p>

        <h2
          className="mt-1 font-[Cinzel] text-[17px] font-semibold"
          style={{ color: COLORS.navy }}
        >
          {title}
        </h2>

        {description && (
          <p
            className="mt-1.5 max-w-2xl font-[Fauna_One] text-[11px] leading-5"
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
      aria-pressed={Boolean(checked)}
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

  if (user.role === "DOCTOR") {
    return <DoctorProfileForm />;
  }

  if (
    user.role === "STOCKIST" ||
    user.role === "DISTRIBUTOR" ||
    user.role === "DISTRIBUTOR_STOCKIST"
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

function DoctorProfileForm() {
  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [unblockingUserId, setUnblockingUserId] = useState("");
  const [loadRetryCount, setLoadRetryCount] = useState(0);
  const imageInputRef = useRef(null);

  useEffect(() => {
    http
      .get("/profiles/doctor/me")
      .then((data) => {
        setProfile(data);
        setOriginalProfile(data);
      })
      .catch((requestError) =>
        setError(
          apiErrorMessage(
            requestError,
            "Unable to load your professional profile."
          )
        )
      );
  }, [loadRetryCount]);

  useEffect(() => {
    setDocumentsLoading(true);
    http
      .get("/verification/status")
      .then((documents) => {
        setVerificationDocuments(Array.isArray(documents) ? documents : []);
        setDocumentsError("");
      })
      .catch((requestError) => {
        setDocumentsError(
          apiErrorMessage(requestError, "Unable to load verification documents.")
        );
      })
      .finally(() => setDocumentsLoading(false));
  }, [documentsRetryCount]);

  useEffect(() => {
    http
      .get("/profiles/doctor/blocked-users")
      .then((users) =>
        setBlockedUsers(Array.isArray(users) ? users : [])
      )
      .catch((requestError) =>
        setError(
          apiErrorMessage(
            requestError,
            "Unable to load blocked professional contacts."
          )
        )
      );
  }, [loadRetryCount]);

  if (!profile && error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError("");
          setLoadRetryCount((count) => count + 1);
        }}
      />
    );
  }
  if (!profile) return <Loader />;

  function update(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function cancelEditing() {
    setProfile(originalProfile);
    setEditing(false);
    setSaved(false);
    setError("");
    setImageUploadError("");
  }

  function toggleListValue(field, value) {
    const current = Array.isArray(profile[field])
      ? profile[field]
      : [];
    update(
      field,
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);

    try {
      const updated = await http.patch("/profiles/doctor/me", profile);
      setProfile(updated);
      setOriginalProfile(updated);
      announceProfileImageUpdated(updated.profileImageUrl);
      setSaved(true);
      setEditing(false);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Failed to save your profile."));
    } finally {
      setSaving(false);
    }
  }

  async function uploadDoctorPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageUploadError("");
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await api.post("/profiles/upload-image", formData);
      const imageUrl = response.data?.data?.url;
      if (!imageUrl) {
        throw new Error("The server did not return an image URL.");
      }
      update("profileImageUrl", imageUrl);
    } catch (uploadError) {
      setImageUploadError(
        apiErrorMessage(uploadError, "Unable to upload your profile photo.")
      );
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  }

  async function unblockUser(userId) {
    setError("");
    setUnblockingUserId(userId);
    try {
      await http.delete(`/profiles/doctor/blocked-users/${userId}`);
      setBlockedUsers((current) =>
        current.filter((user) => user.userId !== userId)
      );
    } catch (requestError) {
      setError(
        apiErrorMessage(
          requestError,
          "Unable to unblock this professional contact."
        )
      );
    } finally {
      setUnblockingUserId("");
    }
  }

  if (!profile) {
    return error ? (
      <p role="alert" className="font-body text-sm text-red-600">
        {error}
      </p>
    ) : (
      <Loader />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <section
        className="rounded-[22px] border bg-white p-5 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-8"
        style={{ borderColor: COLORS.border }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-5">
            <ProfileAvatar
              large
              name={profile.fullName || "Doctor"}
              imageUrl={profile.profileImageUrl}
            />
            <div className="min-w-0">
              <p
                className="font-[Philosopher] text-[9px] uppercase tracking-[0.2em]"
                style={{ color: COLORS.primary }}
              >
                Doctor profile
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1
                  className="break-words font-[Cinzel] text-xl font-semibold leading-snug sm:text-2xl"
                  style={{ color: COLORS.navy }}
                >
                  {profile.fullName || "Professional profile"}
                </h1>
                {profile.registrationStatus === "VERIFIED" && (
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 font-[Philosopher] text-[9px] uppercase tracking-[0.1em]"
                    style={{
                      borderColor: "#D5E9DF",
                      backgroundColor: "#F5FBF7",
                      color: "#32734D",
                    }}
                  >
                    <BadgeCheck size={13} aria-hidden="true" />
                    Verified
                  </span>
                )}
              </div>
              <p
                className="mt-1 font-[Fauna_One] text-xs"
                style={{ color: COLORS.muted }}
              >
                {[profile.specialty, profile.location]
                  .filter(Boolean)
                  .join(" · ") || "Add your professional details"}
              </p>
            </div>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setSaved(false);
                setError("");
              }}
              className="flex items-center gap-2 self-start rounded-full bg-[#D83F87] px-5 py-3 font-[Philosopher] text-[9px] uppercase tracking-[0.1em] text-white transition hover:bg-[#c93679] sm:self-auto"
            >
              <Pencil size={14} />
              Edit profile
            </button>
          )}
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
          Doctor profile updated successfully.
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="p-6 sm:p-8">
          <SectionHeader
            icon={Stethoscope}
            eyebrow="Professional identity"
            title="Profile details"
            description="Share your professional background and general practice location. Do not enter a street address."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label>Full name</Label>
              <Input
                required
                disabled={!editing}
                value={profile.fullName || ""}
                onChange={(event) =>
                  update("fullName", event.target.value)
                }
              />
            </div>
            <div>
              <Label>Specialty</Label>
              <Input
                disabled={!editing}
                value={profile.specialty || ""}
                onChange={(event) =>
                  update("specialty", event.target.value)
                }
              />
            </div>
            <div>
              <Label>Sub-specialty</Label>
              <Input
                disabled={!editing}
                value={profile.subspecialty || ""}
                onChange={(event) =>
                  update("subspecialty", event.target.value)
                }
              />
            </div>
            <div>
              <Label>Qualification</Label>
              <Input
                disabled={!editing}
                value={profile.qualification || ""}
                onChange={(event) =>
                  update("qualification", event.target.value)
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="doctor-profile-photo">Profile photo</Label>
              <div className="flex gap-2">
                <Input
                  id="doctor-profile-photo"
                  disabled={!editing}
                  value={profile.profileImageUrl || ""}
                  onChange={(event) =>
                    update("profileImageUrl", event.target.value)
                  }
                  placeholder="Image URL"
                />
                {editing && (
                  <>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={uploadDoctorPhoto}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      loading={imageUploading}
                      onClick={() => imageInputRef.current?.click()}
                      className="shrink-0 whitespace-nowrap"
                    >
                      <Upload size={14} />
                      Upload from device
                    </Button>
                  </>
                )}
              </div>
              {imageUploadError && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                  {imageUploadError}
                </p>
              )}
              {editing && !imageUploadError && (
                <p className="mt-1 text-xs text-[#7D7582]">
                  Save changes after uploading to apply your photo.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="doctor-city">City</Label>
              <Input
                id="doctor-city"
                required
                maxLength={120}
                disabled={!editing}
                value={profile.location || ""}
                onChange={(event) => update("location", event.target.value)}
                placeholder="City or general locality"
              />
              <p className="mt-1 text-xs text-[#7D7582]">
                Use a city or general locality only, never a precise address.
              </p>
            </div>
            <div>
              <Label>Clinic / hospital affiliation</Label>
              <Input
                maxLength={200}
                disabled={!editing}
                value={profile.clinicHospitalAffiliation || ""}
                onChange={(event) =>
                  update(
                    "clinicHospitalAffiliation",
                    event.target.value
                  )
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label>Languages</Label>
              <TagInput
                disabled={!editing}
                values={profile.languages || []}
                onChange={(values) => update("languages", values)}
                placeholder="e.g. Hindi"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Professional interests</Label>
              <TagInput
                disabled={!editing}
                values={profile.professionalInterests || []}
                onChange={(values) =>
                  update("professionalInterests", values)
                }
                placeholder="e.g. Cardiology"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <SectionHeader
            icon={MessageSquare}
            eyebrow="Consent & scheduling"
            title="Communication preferences"
            description="Requests from verified MRs and companies are off by default. Choose which contacts and appointment formats you are willing to accept."
          />
          <div className="space-y-4">
            <Toggle
              checked={Boolean(profile.acceptsMRRequests)}
              disabled={!editing}
              onChange={(value) => update("acceptsMRRequests", value)}
              label="Accept requests from verified MRs"
              description="Allow verified medical representatives to request a professional appointment."
            />
            <Toggle
              checked={Boolean(profile.acceptsCompanyInformation)}
              disabled={!editing}
              onChange={(value) =>
                update("acceptsCompanyInformation", value)
              }
              label="Accept approved information from verified companies"
              description="Allow verified pharmaceutical companies to request a professional information meeting."
            />
            <div>
              <Label>Categories I will accept</Label>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_CATEGORIES.map((category) => {
                  const selected =
                    profile.acceptedCategories?.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      aria-pressed={Boolean(selected)}
                      disabled={!editing}
                      onClick={() =>
                        toggleListValue("acceptedCategories", category)
                      }
                      className="rounded-full border px-3 py-2 font-body text-xs"
                      style={{
                        borderColor: selected
                          ? COLORS.primary
                          : COLORS.border,
                        backgroundColor: selected
                          ? "#FCE8F1"
                          : "#FFFFFF",
                        color: COLORS.navy,
                        opacity: editing ? 1 : 0.6,
                      }}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 font-body text-xs text-taupe">
                No categories are selected by default. Choose the therapeutic
                areas you are open to discussing with verified companies.
              </p>
            </div>
            <div>
              <Label>Appointment formats</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle
                  checked={profile.communicationModes?.includes("VIDEO")}
                  disabled={!editing}
                  onChange={() => toggleListValue("communicationModes", "VIDEO")}
                  label="Online appointments"
                  description="Accept appointments by video."
                />
                <Toggle
                  checked={profile.communicationModes?.includes("PHYSICAL")}
                  disabled={!editing}
                  onChange={() =>
                    toggleListValue("communicationModes", "PHYSICAL")
                  }
                  label="In-person appointments"
                  description="Accept appointments at your clinic or hospital."
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Appointment length (minutes)</Label>
                <Input
                  type="number"
                  min="5"
                  max="60"
                  step="1"
                  disabled={!editing}
                  value={profile.appointmentDurationMinutes ?? 15}
                  onChange={(event) =>
                    update(
                      "appointmentDurationMinutes",
                      Number(event.target.value)
                    )
                  }
                />
              </div>
              <div>
                <Label>Maximum requests per week</Label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  step="1"
                  disabled={!editing}
                  value={profile.maximumRequestsPerWeek ?? 3}
                  onChange={(event) =>
                    update(
                      "maximumRequestsPerWeek",
                      Number(event.target.value)
                    )
                  }
                />
                <p className="mt-1 text-xs text-[#7D7582]">
                  Set to 0 to pause incoming appointment requests.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {editing && (
          <SaveBar
            saved={saved}
            error={error}
            saving={saving || imageUploading}
            onCancel={cancelEditing}
          />
        )}
      </form>

      <Card className="mt-6 p-6 sm:p-8">
        <SectionHeader
          icon={ShieldCheck}
          eyebrow="Safety"
          title="Blocked professional contacts"
          description="Blocked contacts cannot find you in doctor discovery, request appointments, or continue professional messaging."
        />
        {blockedUsers.length === 0 ? (
          <p className="font-body text-sm text-taupe">
            You have not blocked any contacts.
          </p>
        ) : (
          <ul className="space-y-3">
            {blockedUsers.map((blockedUser) => (
              <li
                key={blockedUser.userId}
                className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-0"
                style={{ borderColor: COLORS.border }}
              >
                <div>
                  <p className="font-body text-sm font-medium text-navy">
                    {blockedUser.name || "PharmUnis member"}
                  </p>
                  <p className="font-body text-xs text-taupe">
                    {blockedUser.role?.replaceAll("_", " ")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={unblockingUserId === blockedUser.userId}
                  onClick={() => unblockUser(blockedUser.userId)}
                >
                  {unblockingUserId === blockedUser.userId
                    ? "Unblocking…"
                    : "Unblock"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function MRProfileForm() {
  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [verificationDocuments, setVerificationDocuments] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [authorizations, setAuthorizations] = useState([]);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [authorizationLoading, setAuthorizationLoading] = useState(true);
  const [verificationError, setVerificationError] = useState(null);
  const [companyError, setCompanyError] = useState(null);
  const [authorizationError, setAuthorizationError] = useState(null);
  const [trustRetryCount, setTrustRetryCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(null);
  const [docType, setDocType] = useState("ID_PROOF");
  const [companyId, setCompanyId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [verificationFile, setVerificationFile] = useState(null);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentUploadError, setDocumentUploadError] = useState(null);
  const [loadRetryCount, setLoadRetryCount] = useState(0);
  const imageInputRef = useRef(null);
  const verificationInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    http
      .get("/profiles/mr/me")
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setOriginalProfile(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            apiErrorMessage(requestError, "Unable to load your MR profile.")
          );
        }
      });

    return () => {
      active = false;
    };
  }, [loadRetryCount]);

  useEffect(() => {
    let active = true;

    http
      .get("/verification/status")
      .then((rows) => {
        if (active) {
          setVerificationDocuments(Array.isArray(rows) ? rows : []);
        }
      })
      .catch((requestError) => {
        if (active) {
          setVerificationError(
            apiErrorMessage(
              requestError,
              "Unable to load your submitted verification documents."
            )
          );
        }
      })
      .finally(() => {
        if (active) setVerificationLoading(false);
      });

    http
      .get("/discover/companies")
      .then((rows) => {
        if (active) {
          setCompanyOptions(Array.isArray(rows) ? rows : []);
        }
      })
      .catch((requestError) => {
        if (active) {
          setCompanyError(
            apiErrorMessage(
              requestError,
              "Unable to load verified pharmaceutical companies."
            )
          );
        }
      });

    http
      .get("/authorizations")
      .then((rows) => {
        if (active) {
          setAuthorizations(Array.isArray(rows) ? rows : []);
          setAuthorizationLoading(false);
        }
      })
      .catch((requestError) => {
        if (active) {
          setAuthorizationError(
            apiErrorMessage(
              requestError,
              "Unable to load your company authorizations."
            )
          );
          setAuthorizationLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [trustRetryCount]);

  const verifiedCompanies = companyOptions.filter(isCompanyVerified);

  if (!profile && error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          setLoadRetryCount((count) => count + 1);
        }}
      />
    );
  }
  if (!profile) return <Loader />;

  function update(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
    setSaved(false);
  }

  function togglePreference(field, value) {
    const currentValues = Array.isArray(profile[field]) ? profile[field] : [];
    update(
      field,
      currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value]
    );
  }

  function refreshVerificationStatus() {
    setVerificationLoading(true);
    setAuthorizationLoading(true);
    setVerificationError(null);
    setCompanyError(null);
    setAuthorizationError(null);
    setTrustRetryCount((count) => count + 1);
  }

  function cancelEditing() {
    setProfile(originalProfile);
    setEditing(false);
    setSaved(false);
    setError(null);
    setImageUploadError(null);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const updated = await http.patch("/profiles/mr/me", {
        ...profile,
        experienceYears: Number(profile.experienceYears) || 0,
      });
      setProfile(updated);
      setOriginalProfile(updated);
      announceProfileImageUpdated(updated.profileImageUrl);
      setSaved(true);
      setEditing(false);
    } catch (err) {
      setError(
        apiErrorMessage(err, "Unable to save your MR profile.")
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadProfileImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageUploadError(null);
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await api.post("/profiles/upload-image", formData);
      const imageUrl = response.data?.data?.url;
      if (!imageUrl) {
        throw new Error("The server did not return an image URL.");
      }
      update("profileImageUrl", imageUrl);
    } catch (uploadError) {
      setImageUploadError(
        apiErrorMessage(uploadError, "Unable to upload your profile photo.")
      );
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  }

  async function uploadVerificationDocument() {
    if (!verificationFile) return;
    setDocumentUploadError(null);
    setDocumentUploading(true);
    try {
      const formData = new FormData();
      formData.append("docType", docType);
      formData.append("file", verificationFile);
      if (docType === "COMPANY_AUTHORIZATION") {
        formData.append("companyId", companyId);
        formData.append("expiryDate", expiryDate);
      }

      await api.post("/verification/documents", formData);
      setVerificationFile(null);
      setCompanyId("");
      setExpiryDate("");
      if (verificationInputRef.current) {
        verificationInputRef.current.value = "";
      }
      refreshVerificationStatus();
    } catch (uploadError) {
      setDocumentUploadError(
        apiErrorMessage(
          uploadError,
          "Unable to upload your verification document."
        )
      );
    } finally {
      setDocumentUploading(false);
    }
  }

  const hasApprovedIdProof = verificationDocuments.some(
    (document) =>
      document.docType === "ID_PROOF" &&
      document.status === "APPROVED" &&
      (!document.expiryDate || new Date(document.expiryDate) > new Date())
  );
  const companyAuthorization = docType === "COMPANY_AUTHORIZATION";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 pb-12">
      <section
        className="rounded-[22px] border bg-white p-5 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-8"
        style={{ borderColor: COLORS.border }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <ProfileAvatar
                large
                name={profile.fullName}
                imageUrl={profile.profileImageUrl}
              />
              {editing && (
                <>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={uploadProfileImage}
                  />
                  <button
                    type="button"
                    disabled={imageUploading}
                    onClick={() => imageInputRef.current?.click()}
                    className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-purple underline disabled:opacity-50"
                  >
                    <Upload size={12} />
                    {imageUploading ? "Uploading..." : "Upload photo"}
                  </button>
                </>
              )}
            </div>

            <div>
              <p
                className="font-[Philosopher] text-[9px] uppercase tracking-[0.2em]"
                style={{ color: COLORS.primary }}
              >
                Professional profile
              </p>
              <h1
                className="mt-1 font-[Cinzel] text-xl font-semibold leading-snug sm:text-2xl"
                style={{ color: COLORS.navy }}
              >
                {profile.fullName || "Medical Representative"}
              </h1>
              {hasApprovedIdProof && (
                <span
                  className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-[Philosopher] text-[9px] font-semibold uppercase tracking-[0.12em]"
                  style={{
                    backgroundColor: "#E9F4EF",
                    color: "#2F7D5F",
                  }}
                >
                  <BadgeCheck size={12} />
                  Verified
                </span>
              )}
              <p
                className="mt-1 font-[Fauna_One] text-xs"
                style={{ color: COLORS.muted }}
              >
                Medical representative
                {profile.isIndependent ? " · Independent" : " · Company affiliated"}
                {profile.experienceYears
                  ? ` · ${profile.experienceYears} years' experience`
                  : ""}
              </p>
              {imageUploadError && (
                <p role="alert" className="mt-2 text-xs text-red-600">
                  {imageUploadError}
                </p>
              )}
            </div>
          </div>

          {!editing && (
            <Button
              type="button"
              onClick={() => {
                setEditing(true);
                setSaved(false);
              }}
              style={{ backgroundColor: COLORS.primary }}
            >
              <Pencil size={14} />
              Edit profile
            </Button>
          )}
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
          Your professional profile was updated.
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="p-6 sm:p-8">
          <SectionHeader
            icon={Stethoscope}
            eyebrow="Professional identity"
            title="About you"
            description="Present your experience, working style, and professional availability."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="mr-full-name">Full name</Label>
              <Input
                id="mr-full-name"
                required
                disabled={!editing}
                value={profile.fullName || ""}
                onChange={(event) => update("fullName", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="mr-experience">Years of experience</Label>
              <Input
                id="mr-experience"
                type="number"
                min={0}
                disabled={!editing}
                value={profile.experienceYears ?? 0}
                onChange={(event) =>
                  update("experienceYears", Number(event.target.value))
                }
              />
            </div>
            <div>
              <Label htmlFor="mr-work-mode">Work mode</Label>
              <Select
                id="mr-work-mode"
                disabled={!editing}
                value={profile.workMode || "FIELD"}
                onChange={(event) => update("workMode", event.target.value)}
              >
                <option value="FIELD">Field</option>
                <option value="HYBRID">Hybrid</option>
                <option value="REMOTE">Remote</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="mr-availability">Availability</Label>
              <Select
                id="mr-availability"
                disabled={!editing}
                value={profile.availabilityStatus || "AVAILABLE"}
                onChange={(event) =>
                  update("availabilityStatus", event.target.value)
                }
              >
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy</option>
                <option value="ON_LEAVE">On leave</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="mr-representation">Professional affiliation</Label>
              <Select
                id="mr-representation"
                disabled={!editing}
                value={profile.isIndependent ? "independent" : "company"}
                onChange={(event) =>
                  update("isIndependent", event.target.value === "independent")
                }
              >
                <option value="company">Company affiliated</option>
                <option value="independent">Independent</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="mr-bio">Professional summary</Label>
              <TextArea
                id="mr-bio"
                rows={4}
                disabled={!editing}
                value={profile.bio || ""}
                onChange={(event) => update("bio", event.target.value)}
                placeholder="Summarize your pharmaceutical field experience and strengths."
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <SectionHeader
            icon={Globe2}
            eyebrow="Expertise"
            title="Specializations & territories"
            description="Help relevant companies and healthcare partners understand where and how you work."
          />
          <div className="grid gap-6 md:grid-cols-2">
            <TagInput
              label="Specializations"
              values={profile.specializations}
              disabled={!editing}
              onChange={(values) => update("specializations", values)}
              placeholder="e.g. Dermatology"
            />
            <TagInput
              label="Languages"
              values={profile.languages}
              disabled={!editing}
              onChange={(values) => update("languages", values)}
              placeholder="e.g. Hindi"
            />
            <div className="md:col-span-2">
              <TagInput
                label="Preferred territories"
                values={profile.territories}
                disabled={!editing}
                onChange={(values) => update("territories", values)}
                placeholder="e.g. Karnal, Haryana"
              />
            </div>
          </div>
          <p className="mt-5 text-xs leading-5 text-taupe">
            Suggested specializations: {PRODUCT_CATEGORIES.join(", ")}
          </p>
          {editing && (
            <SaveBar
              saved={saved}
              error={error}
              saving={saving || imageUploading}
              onCancel={cancelEditing}
            />
          )}
        </Card>

        <Card className="p-6 sm:p-8">
          <SectionHeader
            icon={ShieldCheck}
            eyebrow="Women MR safety & support"
            title="Workplace safety and career preferences"
            description="Optional preferences for safer field work and more relevant career opportunities. No gender identity is collected or displayed."
          />

          <div className="mb-6 rounded-xl border border-[#E9E6EC] bg-[#FCFBFD] p-4 text-xs leading-5 text-[#6E6658]">
            Your safety preferences are private to you. They are not shown on
            public profiles or shared with companies. Career interests are
            shared with a company only when you apply to its opportunity.
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-navy">
                Field-work safety preferences
              </legend>
              <div className="space-y-3">
                {MR_SAFETY_PREFERENCES.map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-start gap-2.5 text-sm leading-5 text-[#6E6658]"
                  >
                    <input
                      type="checkbox"
                      checked={(profile.safetyPreferences || []).includes(value)}
                      disabled={!editing}
                      onChange={() => togglePreference("safetyPreferences", value)}
                      className="mt-1 accent-[#D83F87] disabled:opacity-70"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-navy">
                Career and opportunity interests
              </legend>
              <div className="space-y-3">
                {MR_OPPORTUNITY_PREFERENCES.map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-start gap-2.5 text-sm leading-5 text-[#6E6658]"
                  >
                    <input
                      type="checkbox"
                      checked={(profile.preferredOpportunityTypes || []).includes(value)}
                      disabled={!editing}
                      onChange={() =>
                        togglePreference("preferredOpportunityTypes", value)
                      }
                      className="mt-1 accent-[#D83F87] disabled:opacity-70"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border p-4" style={{ borderColor: COLORS.border }}>
              <h3 className="text-sm font-semibold text-navy">Before a field visit</h3>
              <p className="mt-2 text-xs leading-5 text-taupe">
                Confirm the venue and timing, share your itinerary with someone
                you trust, and plan your return transport.
              </p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: COLORS.border }}>
              <h3 className="text-sm font-semibold text-navy">Support and reporting</h3>
              <p className="mt-2 text-xs leading-5 text-taupe">
                If an interaction feels unsafe, stop the meeting and use
                available block or report controls. For platform support,
                contact{" "}
                <a
                  href="mailto:hello@pharmunis.com?subject=MR%20Safety%20Support"
                  className="font-medium text-purple underline"
                >
                  hello@pharmunis.com
                </a>
                . In immediate danger, contact local emergency services.
              </p>
            </div>
          </div>
        </Card>
      </form>

      <Card className="p-6 sm:p-8">
        <SectionHeader
          icon={ShieldCheck}
          eyebrow="Trust & access"
          title="Identity and company verification"
          description="An admin-approved ID proof enables general connections. Company authorization is separate and is required only for company-scoped activities."
        />
        <div
          className="mb-6 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
          style={{
            borderColor: hasApprovedIdProof ? "#D5E9DF" : COLORS.border,
            backgroundColor: hasApprovedIdProof ? "#F5FBF7" : "#FCFBFD",
          }}
        >
          <div>
            <p className="text-sm font-semibold text-navy">
              {verificationLoading
                ? "Checking identity verification..."
                : hasApprovedIdProof
                  ? "Identity verified — connections enabled"
                  : "Identity verification required to connect"}
            </p>
            <p className="mt-1 text-xs leading-5 text-taupe">
              A current, admin-approved ID proof enables general connections.
              Company authorization is still needed for company-specific
              activities such as representing a company.
            </p>
          </div>
          <Link
            to="/authorizations"
            className="shrink-0 rounded-full bg-purple px-4 py-2.5 text-center text-xs font-medium text-white"
          >
            Manage authorizations
          </Link>
        </div>

        <div className="rounded-xl border p-4 sm:p-5" style={{ borderColor: COLORS.border }}>
          <p className="font-[Cinzel] text-sm font-semibold text-navy">
            Upload verification document
          </p>
          <p className="mt-1 text-xs leading-5 text-taupe">
            Upload an identity document or an authorization letter for a verified company.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="mr-document-type">Document type</Label>
              <Select
                id="mr-document-type"
                value={docType}
                onChange={(event) => {
                  setDocType(event.target.value);
                  setCompanyId("");
                }}
              >
                <option value="ID_PROOF">Identity proof</option>
                <option value="COMPANY_AUTHORIZATION">Company authorization</option>
              </Select>
            </div>
            {companyAuthorization && (
              <>
                <div>
                  <Label htmlFor="mr-authorization-company">Company</Label>
                  <Select
                    id="mr-authorization-company"
                    value={companyId}
                    onChange={(event) => setCompanyId(event.target.value)}
                  >
                    <option value="">Select a verified company</option>
                    {companyOptions.map((company) => (
                      <option
                        key={company.id}
                        value={company.id}
                        disabled={!isCompanyVerified(company)}
                      >
                        {company.companyName}
                        {!isCompanyVerified(company)
                          ? ` (${companyVerificationLabel(company)})`
                          : ""}
                      </option>
                    ))}
                  </Select>
                  {verifiedCompanies.length === 0 && !companyError && (
                    <p className="mt-1 text-xs text-taupe">
                      {companyOptions.length > 0
                        ? "Registered companies are listed here, but can only be selected after PharmUnis verifies their business and registration."
                        : "No pharmaceutical companies are registered on the platform yet."}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="mr-authorization-expiry">Document expiry date</Label>
                  <Input
                    id="mr-authorization-expiry"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={expiryDate}
                    onChange={(event) => setExpiryDate(event.target.value)}
                  />
                </div>
              </>
            )}
            <div className={companyAuthorization ? "" : "md:col-span-2"}>
              <Label htmlFor="mr-verification-file">Document file</Label>
              <input
                ref={verificationInputRef}
                id="mr-verification-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(event) =>
                  setVerificationFile(event.target.files?.[0] || null)
                }
                className="block w-full text-sm text-navy file:mr-3 file:rounded-lg file:border-0 file:bg-[#F1ECFA] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-purple"
              />
            </div>
          </div>
          {companyError && (
            <p role="alert" className="mt-3 text-xs text-red-600">
              {companyError}
            </p>
          )}
          {documentUploadError && (
            <p role="alert" className="mt-3 text-xs text-red-600">
              {documentUploadError}
            </p>
          )}
          <Button
            type="button"
            className="mt-4"
            loading={documentUploading}
            disabled={
              !verificationFile ||
              documentUploading ||
              (companyAuthorization && (!companyId || !expiryDate))
            }
            onClick={uploadVerificationDocument}
          >
            <Upload size={14} />
            Upload for review
          </Button>
        </div>

        <div className="mt-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-[Cinzel] text-sm font-semibold text-navy">
              Submitted documents
            </h3>
            <button
              type="button"
              onClick={refreshVerificationStatus}
              className="text-xs font-medium text-purple underline"
            >
              Refresh verification status
            </button>
          </div>
          {verificationError && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {verificationError}
            </p>
          )}
          {verificationLoading ? (
            <div className="py-6"><Loader /></div>
          ) : verificationError ? null : verificationDocuments.length === 0 ? (
            <div className="mt-3 rounded-xl border p-4 text-xs text-taupe" style={{ borderColor: COLORS.border }}>
              No verification documents submitted yet.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {verificationDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"
                  style={{ borderColor: COLORS.border }}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <FileCheck2 size={17} className="mt-0.5 shrink-0 text-purple" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy">
                        {document.docType.replaceAll("_", " ")}
                      </p>
                      {document.companyId && (
                        <p className="mt-1 text-xs text-taupe">
                          {companyOptions.find(
                            (company) =>
                              String(company.id) === String(document.companyId)
                          )?.companyName || "Company authorization"}
                        </p>
                      )}
                      {document.expiryDate && (
                        <p className="mt-1 text-xs text-taupe">
                          Expires {new Date(document.expiryDate).toLocaleDateString()}
                        </p>
                      )}
                      {document.rejectionReason && (
                        <p className="mt-1 text-xs text-red-600">
                          {document.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={document.status} />
                    {document.fileUrl && (
                      <a
                        href={new URL(document.fileUrl, API_URL).toString()}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-purple underline"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-7 border-t pt-6" style={{ borderColor: COLORS.border }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-[Cinzel] text-sm font-semibold text-navy">
                Company authorizations
              </h3>
              <p className="mt-1 text-xs text-taupe">
                Active authorizations identify the companies and territories you may represent.
              </p>
            </div>
            {authorizationError && (
              <span role="alert" className="text-xs text-red-600">
                {authorizationError}
              </span>
            )}
          </div>
          {authorizationLoading ? (
            <div className="py-6"><Loader /></div>
          ) : authorizationError ? null : authorizations.length === 0 ? (
            <p className="mt-3 rounded-xl border p-4 text-xs text-taupe" style={{ borderColor: COLORS.border }}>
              No company authorizations yet. Upload an authorization document, wait for admin review, then request company approval.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {authorizations.map((authorization) => (
                <div
                  key={authorization.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                  style={{ borderColor: COLORS.border }}
                >
                  <div>
                    <p className="text-sm font-medium text-navy">
                      {authorization.companyName}
                    </p>
                    <p className="mt-1 text-xs text-taupe">
                      {(authorization.categories || []).join(", ") || "No categories listed"}
                    </p>
                    <p className="mt-1 text-xs text-taupe">
                      Territories: {(authorization.territories || []).join(", ") || "Not specified"}
                    </p>
                  </div>
                  <StatusBadge status={authorization.status} />
                </div>
              ))}
            </div>
          )}
          <Link
            to="/authorizations"
            className="mt-4 inline-flex text-sm font-medium text-purple underline"
          >
            Open authorization workspace
          </Link>
        </div>
      </Card>
    </div>
  );
}

function PharmaProfileForm() {
  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [verificationDocuments, setVerificationDocuments] = useState([]);
  const [documentsError, setDocumentsError] = useState("");
  const [documentsRetryCount, setDocumentsRetryCount] = useState(0);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadRetryCount, setLoadRetryCount] = useState(0);
  const logoInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    http
      .get("/profiles/pharma/me")
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        setOriginalProfile(data);
      })
      .catch((requestError) => {
        if (mounted) {
          setError(
            apiErrorMessage(
              requestError,
              "Unable to load your company profile."
            )
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [loadRetryCount]);

  useEffect(() => {
    let mounted = true;
    http
      .get("/verification/status")
      .then((documents) => {
        if (!mounted) return;
        setVerificationDocuments(
          Array.isArray(documents) ? documents : []
        );
        setDocumentsError("");
      })
      .catch((requestError) => {
        if (mounted) {
          setDocumentsError(
            apiErrorMessage(
              requestError,
              "Unable to load company verification documents."
            )
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [documentsRetryCount]);

  if (!profile && error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          setLoadRetryCount((count) => count + 1);
        }}
      />
    );
  }
  if (!profile) return <Loader />;

  function update(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function cancelEditing() {
    setProfile(originalProfile);
    setEditing(false);
    setSaved(false);
    setError(null);
    setLogoUploadError("");
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const patch = {
        ...profile,
        yearEstablished:
          profile.yearEstablished === "" || profile.yearEstablished == null
            ? null
            : Number(profile.yearEstablished),
      };
      const updated = await http.patch(
        "/profiles/pharma/me",
        patch
      );

      setProfile(updated);
      setOriginalProfile(updated);
      announceProfileImageUpdated(updated.logoUrl);
      setSaved(true);
      setEditing(false);
    } catch (err) {
      setError(
        apiErrorMessage(err, "Failed to save company profile.")
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadCompanyLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoUploadError("");
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await api.post("/profiles/upload-image", formData);
      const imageUrl = response.data?.data?.url;
      if (!imageUrl) {
        throw new Error("The server did not return an image URL.");
      }
      update("logoUrl", imageUrl);
    } catch (uploadError) {
      setLogoUploadError(
        apiErrorMessage(uploadError, "Unable to upload the company logo.")
      );
    } finally {
      setLogoUploading(false);
      event.target.value = "";
    }
  }

  const verified = isCompanyVerified(profile);
  const businessDocuments = verificationDocuments.filter(
    (document) => document.docType === "BUSINESS_REG"
  );
  const licenseDocuments = verificationDocuments.filter(
    (document) => document.docType === "DRUG_LICENSE"
  );
  const companyDocuments = [...businessDocuments, ...licenseDocuments];
  const latestLicenseDocument = licenseDocuments[0];
  const latestBusinessDocument = businessDocuments[0];
  const verificationStatus = verified
    ? "VERIFIED"
    : latestBusinessDocument?.status === "PENDING" ||
        latestBusinessDocument?.status === "REJECTED"
      ? latestBusinessDocument.status
      : !latestBusinessDocument
        ? "NOT_SUBMITTED"
        : profile.verificationStatus || "PENDING";
  const verificationLabel = companyVerificationLabel({
    ...profile,
    verificationStatus,
  });
  const safeWebsiteUrl = getSafeExternalUrl(profile.website || "");
  const areasOfOperation = Array.isArray(profile.areasOfOperation)
    ? profile.areasOfOperation
    : [];
  const productCategories = Array.isArray(profile.productCategories)
    ? profile.productCategories
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 pb-12">
      <section
        className="rounded-[22px] border bg-white p-5 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-8"
        style={{ borderColor: COLORS.border }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-5">
            <ProfileAvatar
              large
              name={profile.companyName || "Pharmaceutical company"}
              imageUrl={profile.logoUrl}
            />
            <div className="min-w-0">
              <p
                className="font-[Philosopher] text-[9px] uppercase tracking-[0.2em]"
                style={{ color: COLORS.primary }}
              >
                Pharmaceutical company profile
              </p>
              <h1
                className="mt-1 break-words font-[Cinzel] text-xl font-semibold leading-snug sm:text-2xl"
                style={{ color: COLORS.navy }}
              >
                {profile.companyName || "My company"}
              </h1>
              <p
                className="mt-1 font-[Fauna_One] text-xs"
                style={{ color: COLORS.muted }}
              >
                {profile.manufacturingLocation ||
                  areasOfOperation.join(", ") ||
                  "Add your manufacturing location and operating areas"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-[Philosopher] text-[9px] uppercase tracking-[0.1em]"
              style={{
                backgroundColor: verified ? "#EDF6F0" : "#FFF4E8",
                color: verified ? "#32734D" : "#9A5A18",
              }}
            >
              {verified ? <BadgeCheck size={14} /> : <ShieldCheck size={14} />}
              {verified ? "Verified company" : verificationLabel}
            </span>
            {!editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setSaved(false);
                  setError(null);
                }}
                className="flex items-center gap-2 rounded-full bg-[#D83F87] px-5 py-3 font-[Philosopher] text-[9px] uppercase tracking-[0.1em] text-white transition hover:bg-[#c93679]"
              >
                <Pencil size={14} />
                Edit profile
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
          Company profile updated successfully.
        </div>
      )}

      {error && (
        <div
          role="alert"
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

      <form onSubmit={onSubmit} className="space-y-7">
        <Card className="rounded-[20px] border-[#E9E6EC] bg-white p-6 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-8">
          <SectionHeader
            icon={Building2}
            eyebrow="Identity"
            title="Company information"
            description="Build a complete company presence for representatives, pharmacies, and distribution partners."
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="pharma-company-name">Company name</Label>
              <Input
                id="pharma-company-name"
                required
                maxLength={150}
                disabled={!editing}
                value={profile.companyName ?? ""}
                onChange={(event) => update("companyName", event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="pharma-brand-name">Brand name</Label>
              <Input
                id="pharma-brand-name"
                disabled={!editing}
                maxLength={150}
                value={profile.brandName ?? ""}
                onChange={(event) => update("brandName", event.target.value)}
                placeholder="Primary consumer-facing brand"
              />
            </div>

            <div>
              <Label htmlFor="pharma-company-logo">Company logo</Label>
              <div className="flex gap-2">
                <Input
                  id="pharma-company-logo"
                  disabled={!editing}
                  value={profile.logoUrl ?? ""}
                  onChange={(event) => update("logoUrl", event.target.value)}
                  placeholder="Logo URL"
                />
                {editing && (
                  <>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={uploadCompanyLogo}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      loading={logoUploading}
                      onClick={() => logoInputRef.current?.click()}
                      className="shrink-0 whitespace-nowrap"
                    >
                      <Upload size={14} />
                      Upload from device
                    </Button>
                  </>
                )}
              </div>
              {logoUploadError && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                  {logoUploadError}
                </p>
              )}
              {editing && !logoUploadError && (
                <p className="mt-1 text-xs text-[#7D7582]">
                  Save changes after uploading to apply the new logo.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="pharma-entity-type">Entity type</Label>
              <Input
                id="pharma-entity-type"
                disabled={!editing}
                maxLength={100}
                value={profile.entityType ?? ""}
                onChange={(event) => update("entityType", event.target.value)}
                placeholder="e.g. Private Limited"
              />
            </div>

            <div>
              <Label htmlFor="pharma-year-established">
                Year established
              </Label>
              <Input
                id="pharma-year-established"
                type="number"
                min={1800}
                max={new Date().getFullYear()}
                step={1}
                disabled={!editing}
                value={profile.yearEstablished ?? ""}
                onChange={(event) =>
                  update("yearEstablished", event.target.value)
                }
                placeholder="e.g. 2008"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="pharma-company-description">
                Company overview
              </Label>
              <TextArea
                id="pharma-company-description"
                disabled={!editing}
                rows={5}
                maxLength={2000}
                value={profile.description ?? ""}
                onChange={(event) => update("description", event.target.value)}
                placeholder="Describe your company, therapeutic focus, products, and the partners you work with."
              />
              <p className="mt-1 text-xs text-[#7D7582]">
                {String(profile.description || "").length}/2,000 characters
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[20px] border-[#E9E6EC] bg-white p-6 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-8">
          <SectionHeader
            icon={PackageSearch}
            eyebrow="Operations"
            title="Manufacturing, territories & portfolio"
            description="Help partners understand where you operate and which product categories are relevant to your company."
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="pharma-manufacturing-location">
                Manufacturing / headquarters location
              </Label>
              <Input
                id="pharma-manufacturing-location"
                disabled={!editing}
                maxLength={300}
                value={profile.manufacturingLocation ?? ""}
                onChange={(event) =>
                  update("manufacturingLocation", event.target.value)
                }
                placeholder="City, state, country"
              />
            </div>

            <div>
              <TagInput
                label="Areas of operation"
                values={areasOfOperation}
                onChange={(values) => update("areasOfOperation", values)}
                disabled={!editing}
                placeholder="e.g. Haryana"
              />
              {!editing && areasOfOperation.length === 0 && (
                <p className="mt-1 text-xs text-[#9A929F]">
                  Operating areas not added yet.
                </p>
              )}
            </div>

            <div>
              <TagInput
                label="Product categories"
                values={productCategories}
                onChange={(values) => update("productCategories", values)}
                disabled={!editing}
                placeholder="e.g. Dermatology"
              />
              {!editing && productCategories.length === 0 && (
                <p className="mt-1 text-xs text-[#9A929F]">
                  Product categories not added yet.
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <TagInput
                label="Expansion territories"
                values={
                  Array.isArray(profile.expansionTerritories)
                    ? profile.expansionTerritories
                    : []
                }
                onChange={(values) =>
                  update("expansionTerritories", values)
                }
                disabled={!editing}
                placeholder="e.g. Rajasthan"
              />
              {!editing &&
                (!Array.isArray(profile.expansionTerritories) ||
                  profile.expansionTerritories.length === 0) && (
                  <p className="mt-1 text-xs text-[#9A929F]">
                    Expansion territories not added yet.
                  </p>
                )}
            </div>
          </div>
          {editing && (
            <p className="mt-4 font-[Fauna_One] text-[10px]" style={{ color: COLORS.muted }}>
              Suggested categories: {PRODUCT_CATEGORIES.join(", ")}
            </p>
          )}
        </Card>

        <Card className="rounded-[20px] border-[#E9E6EC] bg-white p-6 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-8">
          <SectionHeader
            icon={Globe2}
            eyebrow="Contact"
            title="Company contact & website"
            description="Add a named contact, support email, and public website so partners know how to reach and learn more about your company."
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="pharma-contact-name">Contact person</Label>
              <Input
                id="pharma-contact-name"
                disabled={!editing}
                maxLength={150}
                value={profile.contactPersonName ?? ""}
                onChange={(event) =>
                  update("contactPersonName", event.target.value)
                }
                placeholder="Full name"
              />
            </div>
            <div>
              <Label htmlFor="pharma-contact-designation">Designation</Label>
              <Input
                id="pharma-contact-designation"
                disabled={!editing}
                maxLength={120}
                value={profile.contactPersonDesignation ?? ""}
                onChange={(event) =>
                  update("contactPersonDesignation", event.target.value)
                }
                placeholder="e.g. Business Development Manager"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="pharma-company-website">Company website</Label>
              <Input
                id="pharma-company-website"
                type="url"
                disabled={!editing}
                value={profile.website ?? ""}
                onChange={(event) => update("website", event.target.value)}
                placeholder="https://www.example.com"
              />
              {!editing && safeWebsiteUrl && (
                <a
                  href={safeWebsiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-purple underline"
                >
                  Visit company website
                </a>
              )}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="pharma-support-email">Support email</Label>
              <Input
                id="pharma-support-email"
                type="email"
                maxLength={254}
                disabled={!editing}
                value={profile.supportEmail ?? ""}
                onChange={(event) =>
                  update("supportEmail", event.target.value)
                }
                placeholder="support@example.com"
              />
            </div>
          </div>
        </Card>

        <Card className="rounded-[20px] border-[#E9E6EC] bg-white p-6 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-8">
          <SectionHeader
            icon={ShieldCheck}
            eyebrow="Trust"
            title="Business verification"
            description="Company registration documents are reviewed in the verification workspace and are not displayed publicly."
          />

          <div className="flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: COLORS.border, backgroundColor: "#FCFAFD" }}>
            <div className="flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: verified ? "#EDF6F0" : "#FFF4E8",
                  color: verified ? "#32734D" : "#9A5A18",
                }}
              >
                {verified ? <BadgeCheck size={18} /> : <FileCheck2 size={18} />}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-[Cinzel] text-sm font-semibold" style={{ color: COLORS.navy }}>
                    {verified ? "Company verified" : verificationLabel}
                  </h3>
                  <StatusBadge
                    status={profile.verificationStatus || "NOT_SUBMITTED"}
                  />
                </div>
                <p className="mt-1 font-[Fauna_One] text-xs leading-5" style={{ color: COLORS.muted }}>
                  {profile.verificationDate
                    ? `Verified on ${new Date(profile.verificationDate).toLocaleDateString()}`
                    : "Submit your business registration document for review."}
                </p>
              </div>
            </div>
            <Link
              to="/verification"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#44318D] px-4 py-3 font-[Philosopher] text-[9px] uppercase tracking-[0.1em] text-white transition hover:bg-[#352574]"
            >
              {verified ? "View verification" : "Manage verification"}
              <Globe2 size={14} />
            </Link>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="pharma-drug-licence-number">
                Manufacturing licence number
              </Label>
              <Input
                id="pharma-drug-licence-number"
                disabled={!editing}
                maxLength={100}
                value={profile.drugLicenceNumber ?? ""}
                onChange={(event) =>
                  update("drugLicenceNumber", event.target.value)
                }
                placeholder="Enter your manufacturing licence number"
              />
              <p className="mt-1 text-xs text-[#7D7582]">
                Kept private. Submit the licence document for verification.
              </p>
            </div>
            <div>
              <Label>Licence expiry date</Label>
              <div
                className="rounded-xl border bg-[#F8F6F8] px-3.5 py-2.5 text-sm text-[#77707D]"
                aria-live="polite"
              >
                {latestLicenseDocument?.expiryDate
                  ? new Date(
                      latestLicenseDocument.expiryDate
                    ).toLocaleDateString()
                  : "Not submitted"}
              </div>
              <p className="mt-1 text-xs text-[#7D7582]">
                Expiry comes from the submitted verification document.
              </p>
            </div>
          </div>

          {documentsError && (
            <p role="alert" className="mt-4 text-xs text-red-600">
              {documentsError}{" "}
              <button
                type="button"
                onClick={() =>
                  setDocumentsRetryCount((count) => count + 1)
                }
                className="underline"
              >
                Try again
              </button>
            </p>
          )}

          {companyDocuments.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="font-[Philosopher] text-[9px] uppercase tracking-[0.14em]" style={{ color: COLORS.muted }}>
                Company verification documents
              </p>
              {companyDocuments.map((document) => (
                <div
                  key={document.id || document._id || document.fileUrl}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
                  style={{ borderColor: COLORS.border }}
                >
                  <span className="font-[Fauna_One] text-xs" style={{ color: COLORS.navy }}>
                    {document.docType.replaceAll("_", " ")}
                    {document.createdAt
                      ? ` · Uploaded ${new Date(document.createdAt).toLocaleDateString()}`
                      : ""}
                  </span>
                  {document.expiryDate && (
                    <span className="font-[Fauna_One] text-xs" style={{ color: COLORS.muted }}>
                      Expires {new Date(document.expiryDate).toLocaleDateString()}
                    </span>
                  )}
                  <StatusBadge status={document.status} />
                  {document.rejectionReason && (
                    <p className="w-full text-xs text-red-600">
                      {document.rejectionReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {editing && (
          <SaveBar
            saved={saved}
            error={error}
            saving={saving}
            onCancel={cancelEditing}
          />
        )}
      </form>

      <div className="flex items-start gap-2 rounded-xl border px-4 py-3" style={{ borderColor: COLORS.border, backgroundColor: "#FCFAFD" }}>
        <MapPin size={14} className="mt-0.5 shrink-0" style={{ color: COLORS.purple }} />
        <p className="font-[Fauna_One] text-[10px] leading-5" style={{ color: COLORS.muted }}>
          Your company name, brand, logo, overview, operating areas, expansion
          territories, product categories, manufacturing location, website, and
          support email help partners find and understand your business. Contact
          person details and verification documents are managed as private
          company information.
        </p>
      </div>
    </div>
  );
}

function PharmacyProfileForm() {
  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [verificationDocuments, setVerificationDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState(null);
  const [documentsRetryCount, setDocumentsRetryCount] = useState(0);
  const [licenseFile, setLicenseFile] = useState(null);
  const licenseInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState(null);
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentUploadError, setDocumentUploadError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadRetryCount, setLoadRetryCount] = useState(0);

  useEffect(() => {
    http
      .get("/profiles/pharmacy/me")
      .then((data) => {
        setProfile(data);
        setOriginalProfile(data);
      })
      .catch((requestError) => {
        setError(
          apiErrorMessage(
            requestError,
            "Unable to load your pharmacy profile."
          )
        );
      });
  }, [loadRetryCount]);

  useEffect(() => {
    setDocumentsLoading(true);
    http
      .get("/verification/status")
      .then((documents) => {
        setVerificationDocuments(
          Array.isArray(documents) ? documents : []
        );
        setDocumentsError(null);
      })
      .catch((requestError) => {
        setDocumentsError(
          apiErrorMessage(
            requestError,
            "Unable to load your verification documents."
          )
        );
      })
      .finally(() => setDocumentsLoading(false));
  }, [documentsRetryCount]);

  if (!profile && error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          setLoadRetryCount((count) => count + 1);
        }}
      />
    );
  }
  if (!profile) return <Loader />;

  function update(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  }

  function updatePharmacistDetails(field, value) {
    setProfile((current) => ({
      ...current,
      pharmacistDetails: {
        ...(current.pharmacistDetails || {}),
        [field]: value,
      },
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
      const patch = { ...profile };
      patch.yearEstablished =
        patch.yearEstablished === "" || patch.yearEstablished == null
          ? null
          : Number(patch.yearEstablished);
      patch.licenceIssueDate =
        patch.licenceIssueDate === "" ? null : patch.licenceIssueDate;

      const updated = await http.patch(
        "/profiles/pharmacy/me",
        patch
      );

      setProfile(updated);
      setOriginalProfile(updated);
      announceProfileImageUpdated(updated.profileImage);
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

  async function uploadDrugLicense() {
    if (!licenseFile || !licenseExpiryDate) return;
    setDocumentUploadError(null);
    setDocumentUploading(true);

    try {
      const formData = new FormData();
      formData.append("docType", "DRUG_LICENSE");
      formData.append("expiryDate", licenseExpiryDate);
      formData.append("file", licenseFile);
      await api.post("/verification/documents", formData);
      setLicenseFile(null);
      if (licenseInputRef.current) licenseInputRef.current.value = "";
      setLicenseExpiryDate("");
      setDocumentsRetryCount((count) => count + 1);
    } catch (requestError) {
      setDocumentUploadError(
        apiErrorMessage(requestError, "Unable to upload the drug licence.")
      );
    } finally {
      setDocumentUploading(false);
    }
  }

  async function uploadProfileLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoUploadError(null);
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await api.post("/profiles/upload-image", formData);
      const imageUrl = response.data?.data?.url;
      if (!imageUrl) {
        throw new Error("The server did not return an image URL.");
      }
      update("profileImage", imageUrl);
    } catch (uploadError) {
      setLogoUploadError(
        apiErrorMessage(uploadError, "Unable to upload the profile logo.")
      );
    } finally {
      setLogoUploading(false);
      event.target.value = "";
    }
  }

  const verified =
    profile.businessVerified ||
    profile.verificationStatus === "VERIFIED" ||
    profile.verification?.status === "VERIFIED";

  const hasPendingLicense = verificationDocuments.some(
    (document) =>
      document.docType === "DRUG_LICENSE" &&
      document.status === "PENDING"
  );
  const hasRejectedLicense = verificationDocuments.some(
    (document) =>
      document.docType === "DRUG_LICENSE" &&
      document.status === "REJECTED"
  );
  const verificationStatus = verified
    ? "VERIFIED"
    : hasPendingLicense
      ? "PENDING"
      : hasRejectedLicense
        ? "REJECTED"
        : profile.verificationStatus ||
          profile.verification?.status ||
          "NOT_SUBMITTED";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 pb-12">
      {/* HEADER */}
      <section
        className="rounded-[22px] border bg-white p-5 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-8"
        style={{
          borderColor: COLORS.border,
        }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <ProfileAvatar
              large
              name={profile.displayName || profile.pharmacyName || "Pharmacy"}
              imageUrl={profile.profileImage || profile.logo}
            />

            <div>
              <p className="font-[Philosopher] text-[9px] uppercase tracking-[0.2em]" style={{ color: COLORS.primary }}>
                Pharmacy Profile
              </p>

              <h1 className="mt-1 font-[Cinzel] text-xl font-semibold leading-snug sm:text-2xl" style={{ color: COLORS.navy }}>
                {profile.displayName ||
                  profile.pharmacyName ||
                  "My Pharmacy"}
              </h1>

              <p className="mt-1 font-[Fauna_One] text-xs" style={{ color: COLORS.muted }}>
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
              <div className="flex items-center gap-2 rounded-full px-3 py-2" style={{ backgroundColor: "#EDF6F0", color: "#32734D" }}>
                <ShieldCheck
                  size={14}
                />

                <span className="font-[Philosopher] text-[9px] uppercase tracking-[0.1em]">
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
                className="flex items-center gap-2 rounded-full bg-[#D83F87] px-5 py-3 font-[Philosopher] text-[9px] uppercase tracking-[0.1em] text-white transition hover:bg-[#c93679]"
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

      <form onSubmit={onSubmit} className="space-y-7">
        {/* BASIC INFORMATION */}
        <Card className="rounded-[20px] border-[#E9E6EC] bg-white p-6 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-8">
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
                  <>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={uploadProfileLogo}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      loading={logoUploading}
                      onClick={() => logoInputRef.current?.click()}
                      className="shrink-0 whitespace-nowrap"
                    >
                      <Upload size={14} />
                      Upload from device
                    </Button>
                  </>
                )}
              </div>
              {logoUploadError && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                  {logoUploadError}
                </p>
              )}
              {editing && !logoUploadError && (
                <p className="mt-1 text-xs text-[#7D7582]">
                  Save changes after uploading to apply the new logo.
                </p>
              )}
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

            <div className="md:col-span-2">
              <Label>Business hours</Label>
              <WeeklyScheduleEditor
                businessHours
                disabled={!editing}
                values={profile.businessHours}
                onChange={(value) => update("businessHours", value)}
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
        <Card className="rounded-[20px] border-[#E9E6EC] bg-white p-6 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-8">
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
        <Card className="rounded-[20px] border-[#E9E6EC] bg-white p-6 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-8">
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
                  profile.drugLicenceNumber ??
                  ""
                }
                onChange={(event) =>
                  update(
                    "drugLicenceNumber",
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
                value={String(profile.licenceIssueDate || "").slice(0, 10)}
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
                disabled
                type="date"
                value={String(profile.licenceExpiryDate || "").slice(0, 10)}
              />
              <p className="mt-1 text-xs text-taupe">
                Updated from your approved drug licence document.
              </p>
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
                  profile.pharmacistDetails?.name ?? ""
                }
                onChange={(event) =>
                  updatePharmacistDetails(
                    "name",
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
                  profile.pharmacistDetails?.qualification ?? ""
                }
                onChange={(event) =>
                  updatePharmacistDetails(
                    "qualification",
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
                  profile.pharmacistDetails?.registrationNumber ??
                  ""
                }
                onChange={(event) =>
                  updatePharmacistDetails(
                    "registrationNumber",
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

                {profile.lastVerifiedDate && (
                  <p
                    className="mt-2 font-[Fauna_One] text-[10px]"
                    style={{ color: COLORS.muted }}
                  >
                    Last verified:{" "}
                    {new Date(profile.lastVerifiedDate).toLocaleDateString()}
                  </p>
                )}

                {profile.nextVerificationDate && (
                  <p
                    className="mt-1 font-[Fauna_One] text-[10px]"
                    style={{ color: COLORS.muted }}
                  >
                    Next verification:{" "}
                    {new Date(profile.nextVerificationDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div>
              <p className="font-[Cinzel] text-xs font-semibold" style={{ color: COLORS.navy }}>
                Verification documents
              </p>
              <p className="mt-1 font-[Fauna_One] text-[10px]" style={{ color: COLORS.muted }}>
                Documents submitted here or from the Verification page appear below and are reviewed by an admin.
              </p>
            </div>

            <div className="mt-4 rounded-xl border p-4" style={{ borderColor: COLORS.border, backgroundColor: "#FCFBFD" }}>
              <p className="font-[Cinzel] text-xs font-semibold text-navy">
                Upload pharmacy drug licence
              </p>
              <p className="mt-1 text-[10px] leading-5 text-[#7D7582]">
                Submit a clear certificate with its expiry date. An admin reviews the document before verification is granted.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                <div>
                  <Label htmlFor="pharmacy-drug-license">Certificate file</Label>
                  <input
                    ref={licenseInputRef}
                    id="pharmacy-drug-license"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(event) =>
                      setLicenseFile(event.target.files?.[0] || null)
                    }
                    className="block w-full text-sm text-navy file:mr-3 file:rounded-lg file:border-0 file:bg-[#F1ECFA] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-purple"
                  />
                </div>
                <div>
                  <Label htmlFor="pharmacy-license-expiry">Expiry date</Label>
                  <Input
                    id="pharmacy-license-expiry"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={licenseExpiryDate}
                    onChange={(event) =>
                      setLicenseExpiryDate(event.target.value)
                    }
                  />
                </div>
                <Button
                  type="button"
                  loading={documentUploading}
                  disabled={!licenseFile || !licenseExpiryDate}
                  onClick={uploadDrugLicense}
                >
                  <Upload size={14} />
                  Upload certificate
                </Button>
              </div>
              {documentUploadError && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                  {documentUploadError}
                </p>
              )}
            </div>

            {documentsLoading ? (
              <p className="mt-3 text-sm text-[#7D7582]">Loading documents…</p>
            ) : documentsError ? (
              <div className="mt-3">
                <p role="alert" className="text-sm text-red-600">{documentsError}</p>
                <button
                  type="button"
                  className="mt-2 text-sm font-medium text-purple underline"
                  onClick={() => setDocumentsRetryCount((count) => count + 1)}
                >
                  Retry
                </button>
              </div>
            ) : verificationDocuments.length === 0 ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border p-4" style={{ borderColor: COLORS.border }}>
                <FileCheck2 size={17} style={{ color: COLORS.purple }} />
                <p className="text-xs text-[#7D7582]">No verification documents uploaded yet.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {verificationDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"
                    style={{ borderColor: COLORS.border }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy">
                        {document.docType.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-xs text-[#7D7582]">
                        Submitted {new Date(document.createdAt).toLocaleDateString()}
                        {document.expiryDate &&
                          ` · Expires ${new Date(document.expiryDate).toLocaleDateString()}`}
                      </p>
                      {document.rejectionReason && (
                        <p className="mt-1 text-xs text-red-600">
                          {document.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={document.status} />
                      {document.fileUrl && (
                        <a
                          href={new URL(document.fileUrl, API_URL).toString()}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-purple underline"
                        >
                          View file
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* PROCUREMENT */}
        <Card className="rounded-[20px] border-[#E9E6EC] bg-white p-6 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-8">
          <SectionHeader
            icon={PackageSearch}
            eyebrow="Procurement"
            title="Business & procurement preferences"
            description="These preferences help PharmUnis match your pharmacy with relevant supply partners."
          />

          <div className="space-y-5">
            <TagInput
              label="Product categories of interest"
              values={Array.isArray(profile.interestedCategories)
                ? profile.interestedCategories
                : []}
              onChange={(values) =>
                update("interestedCategories", values)
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
                    profile.newCompanyInterest === false ? "NO" : "YES"
                  }
                  onChange={(event) =>
                    update(
                      "newCompanyInterest",
                      event.target.value === "YES"
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
                    profile.alternativeBrandAcceptance ? "YES" : "NO"
                  }
                  onChange={(event) =>
                    update(
                      "alternativeBrandAcceptance",
                      event.target.value === "YES"
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

            </div>

            <TagInput
              label="Delivery preferences"
              values={Array.isArray(profile.deliveryPreferences)
                ? profile.deliveryPreferences
                : []}
              onChange={(values) => update("deliveryPreferences", values)}
              placeholder="e.g. Scheduled delivery"
              disabled={!editing}
            />

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
        <Card className="rounded-[20px] border-[#E9E6EC] bg-white p-6 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-8">
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

          </div>
          <div className="mt-5">
            <Label>Preferred MR visit hours</Label>
            <WeeklyScheduleEditor
              disabled={!editing}
              values={profile.preferredMRVisitHours}
              onChange={(value) => update("preferredMRVisitHours", value)}
            />
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
                    className="rounded-xl border px-3 py-2 font-[Philosopher] text-[9px] uppercase tracking-[0.06em] transition"
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
        <Card className="rounded-[20px] border-[#E9E6EC] bg-white p-6 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-8">
          <SectionHeader
            icon={Globe2}
            eyebrow="Privacy"
            title="Profile visibility"
            description="Keep sensitive pharmacy information under your control."
          />

          <ul className="mt-5 space-y-3">
            {[
              {
                title: "Public discovery",
                description:
                  "Basic pharmacy information can be used in discovery and requirement matching.",
              },
              {
                title: "Licence information",
                description:
                  "Your licence details remain restricted according to your privacy settings.",
              },
              {
                title: "Verification documents",
                description:
                  "Your documents are used for verification and are not part of your public profile.",
              },
              {
                title: "Exact address",
                description:
                  "Your exact address is shared according to your privacy settings.",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0"
                style={{ borderColor: COLORS.border }}
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS.primary }}
                />
                <p className="font-[Fauna_One] text-xs leading-6" style={{ color: COLORS.muted }}>
                  <span className="font-semibold" style={{ color: COLORS.navy }}>
                    {item.title}:
                  </span>{" "}
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
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
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState("");
  const [verificationDocuments, setVerificationDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState("");
  const [documentsRetryCount, setDocumentsRetryCount] = useState(0);
  const [licenseFile, setLicenseFile] = useState(null);
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentUploadError, setDocumentUploadError] = useState("");
  const licenseInputRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadRetryCount, setLoadRetryCount] = useState(0);

  useEffect(() => {
    http
      .get("/profiles/stockist/me")
      .then((loaded) => {
        setProfile(loaded);
        setDraft(loaded);
      })
      .catch((requestError) => {
        setError(
          apiErrorMessage(
            requestError,
            "Unable to load your distributor profile."
          )
        );
      });
  }, [loadRetryCount]);

  useEffect(() => {
    setDocumentsLoading(true);
    http
      .get("/verification/status")
      .then((documents) => {
        setVerificationDocuments(Array.isArray(documents) ? documents : []);
        setDocumentsError("");
      })
      .catch((requestError) => {
        setDocumentsError(
          apiErrorMessage(requestError, "Unable to load verification documents.")
        );
      })
      .finally(() => setDocumentsLoading(false));
  }, [documentsRetryCount]);

  if (!profile && error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          setLoadRetryCount((count) => count + 1);
        }}
      />
    );
  }
  if (!profile || !draft) return <Loader />;

  async function uploadLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoUploadError("");
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await api.post("/profiles/upload-image", formData);
      const imageUrl = response.data?.data?.url;
      if (!imageUrl) throw new Error("The server did not return an image URL.");
      setDraft((current) => ({ ...current, logoUrl: imageUrl }));
    } catch (uploadError) {
      setLogoUploadError(
        apiErrorMessage(uploadError, "Unable to upload the business logo.")
      );
    } finally {
      setLogoUploading(false);
      event.target.value = "";
    }
  }

  async function uploadDrugLicense() {
    if (!licenseFile || !licenseExpiryDate) return;
    setDocumentUploadError("");
    setDocumentUploading(true);
    try {
      const formData = new FormData();
      formData.append("docType", "DRUG_LICENSE");
      formData.append("expiryDate", licenseExpiryDate);
      formData.append("file", licenseFile);
      await api.post("/verification/documents", formData);
      setLicenseFile(null);
      setLicenseExpiryDate("");
      if (licenseInputRef.current) licenseInputRef.current.value = "";
      setDocumentsRetryCount((count) => count + 1);
    } catch (requestError) {
      setDocumentUploadError(
        apiErrorMessage(requestError, "Unable to upload the drug licence.")
      );
    } finally {
      setDocumentUploading(false);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const updated = await http.patch(
        "/profiles/stockist/me",
        draft
      );

      setProfile(updated);
      setDraft(updated);
      setEditing(false);
      announceProfileImageUpdated(
        updated.profileImageUrl || updated.logoUrl || null
      );
      setSaved(true);
    } catch (err) {
      setError(
        apiErrorMessage(err, "Failed to save")
      );
    } finally {
      setSaving(false);
    }
  }

  const roleLabel =
    profile.type === "DISTRIBUTOR"
      ? "Distributor"
      : profile.type === "C_AND_F_AGENT"
        ? "C&F Agent"
        : "Stockist";
  const hasApprovedLicence = verificationDocuments.some(
    (document) =>
      document.docType === "DRUG_LICENSE" &&
      document.status === "APPROVED" &&
      (!document.expiryDate || new Date(document.expiryDate) > new Date())
  );
  const hasPendingLicence = verificationDocuments.some(
    (document) =>
      document.docType === "DRUG_LICENSE" &&
      document.status === "PENDING"
  );
  const hasRejectedLicence = verificationDocuments.some(
    (document) =>
      document.docType === "DRUG_LICENSE" &&
      document.status === "REJECTED"
  );
  const verificationStatus = hasApprovedLicence
    ? "VERIFIED"
    : hasPendingLicence
      ? "PENDING"
      : hasRejectedLicence
        ? "REJECTED"
        : "NOT_SUBMITTED";

  const fieldsCompleted = [
    draft.companyName,
    draft.description,
    draft.location,
    draft.website,
    draft.contactPersonName,
    draft.serviceAreas?.length,
    draft.productCategories?.length,
    draft.associatedCompanies?.length,
    draft.pinCodes?.length,
    draft.deliveryTimeHours,
    draft.serviceStatus,
  ].filter(Boolean).length;
  const profileCompletion = Math.round((fieldsCompleted / 11) * 100);

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function beginEditing() {
    setDraft(profile);
    setSaved(false);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(profile);
    setSaved(false);
    setError(null);
    setEditing(false);
  }

  return (
    <main className="mx-auto max-w-5xl pb-12">
      <section
        className="relative overflow-hidden rounded-[22px] border px-5 py-7 shadow-[0_8px_28px_rgba(42,27,61,0.05)] sm:px-8"
        style={{ borderColor: COLORS.border, backgroundColor: "#FFFFFF" }}
      >
        <div
          className="absolute right-0 top-0 h-28 w-28 rounded-bl-[80px]"
          style={{ backgroundColor: "#FFF1F7" }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="text-center">
              <ProfileAvatar
                large
                name={draft.companyName || roleLabel}
                imageUrl={draft.logoUrl}
              />
              {editing && (
                <>
                  <label
                    htmlFor="stockist-logo"
                    className="mt-2 inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1.5 text-[9px] font-medium"
                    style={{ borderColor: COLORS.border, color: COLORS.purple }}
                  >
                    <Upload size={11} />
                    {logoUploading ? "Uploading..." : "Upload logo"}
                  </label>
                  <input
                    id="stockist-logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={logoUploading}
                    onChange={uploadLogo}
                  />
                </>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-taupe">
                  {roleLabel} profile
                </p>
                {(profile.businessVerified || verificationStatus === "VERIFIED") && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-medium" style={{ backgroundColor: "#EAF7EF", color: "#32734D" }}>
                    <BadgeCheck size={11} />
                    Verified
                  </span>
                )}
                {!profile.businessVerified && verificationStatus !== "VERIFIED" && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-medium"
                    style={{
                      backgroundColor: verificationStatus === "PENDING" ? "#FFF4D8" : "#FCE8F1",
                      color: verificationStatus === "PENDING" ? "#9A6700" : COLORS.primary,
                    }}
                  >
                    {verificationStatus.replaceAll("_", " ")}
                  </span>
                )}
              </div>
              <h1 className="mt-1 break-words font-[Cinzel] text-xl font-semibold sm:text-2xl" style={{ color: COLORS.navy }}>
                {draft.companyName || `My ${roleLabel}`}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-taupe">
                <MapPin size={12} />
                {draft.location || "Location not added"}
              </p>
            </div>
          </div>
          {!editing && (
            <Button type="button" variant="secondary" onClick={beginEditing}>
              <Pencil size={14} />
              Edit profile
            </Button>
          )}
        </div>

        <div className="relative mt-6 border-t pt-5" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-taupe">Profile completion</span>
            <strong style={{ color: COLORS.purple }}>{profileCompletion}%</strong>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "#EEEAF5" }}>
            <div className="h-full rounded-full transition-[width]" style={{ width: `${profileCompletion}%`, backgroundColor: COLORS.primary }} />
          </div>
        </div>
      </section>

      <Card className="mt-6">
        <form onSubmit={onSubmit} className="space-y-7">
          <section>
            <div className="border-b pb-4" style={{ borderColor: COLORS.border }}>
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: COLORS.primary }}>Business information</p>
              <h2 className="mt-1 font-[Cinzel] text-lg font-semibold" style={{ color: COLORS.navy }}>Company details</h2>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <Label>Company name</Label>
                <Input required disabled={!editing} value={draft.companyName || ""} onChange={(event) => update("companyName", event.target.value)} />
              </div>
              <div>
                <Label>Business type</Label>
                <Select disabled={!editing} value={draft.type || "STOCKIST"} onChange={(event) => update("type", event.target.value)}>
                  <option value="STOCKIST">Stockist</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                  <option value="C_AND_F_AGENT">C&F Agent</option>
                </Select>
              </div>
              <div>
                <Label>Location / headquarters</Label>
                <Input disabled={!editing} value={draft.location || ""} onChange={(event) => update("location", event.target.value)} placeholder="City, State" />
              </div>
              <div>
                <Label>Website</Label>
                <Input disabled={!editing} type="url" value={draft.website || ""} onChange={(event) => update("website", event.target.value)} placeholder="https://" />
              </div>
              <div className="sm:col-span-2">
                <Label>Business description</Label>
                <TextArea disabled={!editing} rows={4} value={draft.description || ""} onChange={(event) => update("description", event.target.value)} placeholder="Describe your supply network, specialties and service capabilities." />
              </div>
            </div>
          </section>

          <section>
            <div className="border-b pb-4" style={{ borderColor: COLORS.border }}>
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: COLORS.primary }}>Service areas</p>
              <h2 className="mt-1 font-[Cinzel] text-lg font-semibold" style={{ color: COLORS.navy }}>Delivery and supply details</h2>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <TagInput
                label="PIN codes"
                values={draft.pinCodes || []}
                disabled={!editing}
                onChange={(values) => update("pinCodes", values)}
                placeholder="e.g. 122001"
              />
              <div>
                <Label>Delivery time (hours)</Label>
                <Input
                  disabled={!editing}
                  type="number"
                  min="0"
                  value={draft.deliveryTimeHours ?? 24}
                  onChange={(event) => update("deliveryTimeHours", Number(event.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Delivery window</Label>
                <Input disabled={!editing} value={draft.deliveryWindow || ""} onChange={(event) => update("deliveryWindow", event.target.value)} placeholder="e.g. 9 AM–6 PM" />
              </div>
              <div>
                <Label>Minimum order band</Label>
                <Input disabled={!editing} value={draft.minimumOrderBand || ""} onChange={(event) => update("minimumOrderBand", event.target.value)} placeholder="e.g. ₹5,000–₹10,000" />
              </div>
              <div>
                <Label>Storage capacity</Label>
                <Input disabled={!editing} value={draft.storageCapacity || ""} onChange={(event) => update("storageCapacity", event.target.value)} />
              </div>
              <div>
                <Label>Service status</Label>
                <Select disabled={!editing} value={draft.serviceStatus || "AVAILABLE"} onChange={(event) => update("serviceStatus", event.target.value)}>
                  <option value="AVAILABLE">Available</option>
                  <option value="LIMITED">Limited</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                </Select>
              </div>
              <div>
                <Label>Special handling</Label>
                <TextArea disabled={!editing} rows={3} value={draft.specialHandling || ""} onChange={(event) => update("specialHandling", event.target.value)} placeholder="Fragile, temperature-controlled, or other handling requirements." />
              </div>
              <div>
                <Label>Return policy summary</Label>
                <TextArea disabled={!editing} rows={3} value={draft.returnPolicySummary || ""} onChange={(event) => update("returnPolicySummary", event.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Service description</Label>
                <TextArea disabled={!editing} rows={3} value={draft.serviceDescription || ""} onChange={(event) => update("serviceDescription", event.target.value)} placeholder="Describe your current supply and delivery coverage." />
              </div>
              <label className="flex items-center gap-2 text-xs" style={{ color: COLORS.navy }}>
                <input
                  type="checkbox"
                  disabled={!editing}
                  checked={Boolean(draft.coldChain)}
                  onChange={(event) => update("coldChain", event.target.checked)}
                />
                Cold chain available
              </label>
              <label className="flex items-center gap-2 text-xs" style={{ color: COLORS.navy }}>
                <input
                  type="checkbox"
                  disabled={!editing}
                  checked={Boolean(draft.emergencySupply)}
                  onChange={(event) => update("emergencySupply", event.target.checked)}
                />
                Emergency supply available
              </label>
            </div>
          </section>

          <section>
            <div className="border-b pb-4" style={{ borderColor: COLORS.border }}>
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: COLORS.primary }}>Operations</p>
              <h2 className="mt-1 font-[Cinzel] text-lg font-semibold" style={{ color: COLORS.navy }}>Coverage and capabilities</h2>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <TagInput label="Service areas" values={draft.serviceAreas || []} disabled={!editing} onChange={(values) => update("serviceAreas", values)} placeholder="e.g. Haryana" />
              <TagInput label="Product categories" values={draft.productCategories || []} disabled={!editing} onChange={(values) => update("productCategories", values)} placeholder="e.g. Dermatology" />
              <TagInput label="Associated companies" values={draft.associatedCompanies || []} disabled={!editing} onChange={(values) => update("associatedCompanies", values)} placeholder="Add a pharmaceutical company" />
              <div>
                <Label>Minimum order value</Label>
                <Input disabled={!editing} value={draft.minimumOrderValue || ""} onChange={(event) => update("minimumOrderValue", event.target.value)} placeholder="e.g. ₹10,000" />
              </div>
              <div className="sm:col-span-2">
                <TagInput label="Delivery modes" values={draft.deliveryModes || []} disabled={!editing} onChange={(values) => update("deliveryModes", values)} placeholder="e.g. Own fleet, Courier" />
              </div>
            </div>
          </section>

          <section>
            <div className="border-b pb-4" style={{ borderColor: COLORS.border }}>
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: COLORS.primary }}>Contact</p>
              <h2 className="mt-1 font-[Cinzel] text-lg font-semibold" style={{ color: COLORS.navy }}>Business contact</h2>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <Label>Contact person</Label>
                <Input disabled={!editing} value={draft.contactPersonName || ""} onChange={(event) => update("contactPersonName", event.target.value)} />
              </div>
              <div>
                <Label>Designation</Label>
                <Input disabled={!editing} value={draft.contactPersonDesignation || ""} onChange={(event) => update("contactPersonDesignation", event.target.value)} placeholder="e.g. Operations Manager" />
              </div>
            </div>
          </section>

          <section>
            <div className="border-b pb-4" style={{ borderColor: COLORS.border }}>
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: COLORS.primary }}>Trust and verification</p>
              <h2 className="mt-1 font-[Cinzel] text-lg font-semibold" style={{ color: COLORS.navy }}>Business verification</h2>
            </div>

            <div className="mt-5 rounded-2xl border p-5" style={{ borderColor: COLORS.border, backgroundColor: "#FCFBFD" }}>
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5" style={{ color: COLORS.purple }} />
                <div>
                  <p className="font-[Cinzel] text-xs font-semibold" style={{ color: COLORS.navy }}>Verification status</p>
                  <p className="mt-1 font-[Fauna_One] text-xs" style={{ color: COLORS.muted }}>
                    {profile.businessVerified || verificationStatus === "VERIFIED"
                      ? "VERIFIED"
                      : verificationStatus.replaceAll("_", " ")}
                  </p>
                  {profile.licenceExpiryDate && (
                    <p className="mt-2 font-[Fauna_One] text-[10px]" style={{ color: COLORS.muted }}>
                      Licence expiry: {new Date(profile.licenceExpiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className="font-[Cinzel] text-xs font-semibold" style={{ color: COLORS.navy }}>Verification documents</p>
              <p className="mt-1 font-[Fauna_One] text-[10px]" style={{ color: COLORS.muted }}>
                Upload a drug licence for admin review. The licence expiry date is stored as verification metadata.
              </p>

              <div className="mt-4 grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end" style={{ borderColor: COLORS.border, backgroundColor: "#FCFBFD" }}>
                <div>
                  <Label htmlFor="stockist-drug-license">Licence certificate</Label>
                  <input
                    ref={licenseInputRef}
                    id="stockist-drug-license"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(event) => setLicenseFile(event.target.files?.[0] || null)}
                    className="block w-full text-sm text-navy file:mr-3 file:rounded-lg file:border-0 file:bg-[#F1ECFA] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-purple"
                  />
                </div>
                <div>
                  <Label htmlFor="stockist-license-expiry">Expiry date</Label>
                  <Input
                    id="stockist-license-expiry"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={licenseExpiryDate}
                    onChange={(event) => setLicenseExpiryDate(event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  loading={documentUploading}
                  disabled={!licenseFile || !licenseExpiryDate}
                  onClick={uploadDrugLicense}
                >
                  <Upload size={14} />
                  Upload
                </Button>
              </div>

              {documentUploadError && (
                <p className="mt-2 text-xs" style={{ color: "#B42318" }}>{documentUploadError}</p>
              )}

              <div className="mt-4">
                {documentsLoading ? (
                  <p className="text-xs text-taupe">Loading verification documents...</p>
                ) : documentsError ? (
                  <p className="text-xs" style={{ color: "#B42318" }}>{documentsError}</p>
                ) : verificationDocuments.length === 0 ? (
                  <p className="text-xs text-taupe">No verification documents submitted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {verificationDocuments.map((document) => (
                      <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3" style={{ borderColor: COLORS.border }}>
                        <div>
                          <p className="text-xs font-medium text-navy">{String(document.docType).replaceAll("_", " ")}</p>
                          {document.expiryDate && (
                            <p className="mt-1 text-[10px] text-taupe">
                              Expiry: {new Date(document.expiryDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={document.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {editing ? (
            <SaveBar
              saved={saved}
              error={error}
              saving={saving}
              onCancel={cancelEditing}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-3 border-t pt-5" style={{ borderColor: COLORS.border }}>
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "#32734D" }}>
                  <CheckCircle2 size={14} /> Profile saved
                </span>
              )}
              <Link to="/verification" className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em]" style={{ color: COLORS.primary }}>
                <ShieldCheck size={13} />
                Business verification
              </Link>
            </div>
          )}
        </form>
      </Card>
    </main>
  );
}