import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  MapPin,
  PackageSearch,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

import { http } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Card, Button } from "../components/ui";
import {
  MR_SUPPORT_REQUEST_OPTIONS,
  PRODUCT_CATEGORIES as THERAPEUTIC_AREAS,
} from "../lib/constants";

const PROCUREMENT_CATEGORIES = [
  "TABLETS",
  "CAPSULES",
  "SYRUPS",
  "INJECTIONS",
  "CREAMS",
  "OINTMENTS",
  "DROPS",
  "SURGICAL",
  "OTC",
  "OTHER",
];

const SUPPLIER_TYPES = [
  {
    value: "COMPANY",
    label: "Pharma Companies",
    description:
      "Connect with pharmaceutical manufacturers and companies.",
    icon: PackageSearch,
  },
  {
    value: "MR",
    label: "Medical Representatives",
    description:
      "Request product information, a pharmacy visit, or other professional support. MRs do not supply medicine stock.",
    icon: Users,
  },
  {
    value: "DISTRIBUTOR_STOCKIST",
    label: "Distributors & Stockists",
    description:
      "Find distributors and stockists who can fulfil your requirement.",
    icon: MapPin,
  },
];

const URGENCY_OPTIONS = [
  {
    value: "LOW",
    label: "Low",
    description: "No immediate need",
  },
  {
    value: "NORMAL",
    label: "Normal",
    description: "Needed within the usual timeframe",
  },
  {
    value: "HIGH",
    label: "High",
    description: "Priority request",
  },
];

function getApiMessage(
  error,
  fallback = "Something went wrong. Please try again."
) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    error?.message ||
    fallback
  );
}

function getRequirementFromResponse(result) {
  if (!result) return null;

  // { requirement: {...} }
  if (result.requirement) {
    return result.requirement;
  }

  // { data: { requirement: {...} } }
  if (result.data?.requirement) {
    return result.data.requirement;
  }

  // { data: {...requirement} }
  if (result.data?.id || result.data?._id) {
    return result.data;
  }

  // requirement itself
  if (result.id || result._id) {
    return result;
  }

  return null;
}

export default function RequirementCreatePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isDistributorRole =
    user?.role === "DISTRIBUTOR_STOCKIST" ||
    user?.role === "DISTRIBUTOR" ||
    user?.role === "STOCKIST";
  const canCreateRequirement =
    user?.role === "PHARMACY" || isDistributorRole;
  const isCompanyRole =
    user?.role === "PHARMA_COMPANY" || user?.role === "COMPANY";

  const [category, setCategory] = useState(
    PROCUREMENT_CATEGORIES?.[0] || ""
  );
  const [requestType, setRequestType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("NORMAL");
  const [supplierType, setSupplierType] = useState(
    isDistributorRole ? "COMPANY" : "DISTRIBUTOR_STOCKIST"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isMRSupportRequest = supplierType === "MR";
  const categoryOptions = isMRSupportRequest
    ? THERAPEUTIC_AREAS
    : PROCUREMENT_CATEGORIES;
  const availableSupplierTypes = isDistributorRole
    ? SUPPLIER_TYPES.filter(
        (item) => item.value === "COMPANY"
      )
    : SUPPLIER_TYPES;

  function handleSupplierTypeChange(nextSupplierType) {
    if (nextSupplierType === supplierType) return;

    setSupplierType(nextSupplierType);
    setCategory(
      nextSupplierType === "MR"
        ? THERAPEUTIC_AREAS[0]
        : PROCUREMENT_CATEGORIES[0]
    );
    setRequestType(
      nextSupplierType === "MR"
        ? MR_SUPPORT_REQUEST_OPTIONS[0].value
        : ""
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!category) {
      setError(
        isMRSupportRequest
          ? "Please select a therapeutic area."
          : "Please select a product category."
      );
      return;
    }

    if (isMRSupportRequest && !requestType) {
      setError("Please select the type of support you need.");
      return;
    }

    if (cleanTitle.length < 3) {
      setError("Requirement title must be at least 3 characters.");
      return;
    }

    if (cleanDescription.length < 5) {
      setError(
        "Please provide a little more detail about your requirement."
      );
      return;
    }

    if (!supplierType) {
      setError("Please select who should receive this requirement.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        category,
        title: cleanTitle,
        description: cleanDescription,
        urgency,
        ...(isMRSupportRequest ? { requestType } : {}),

        // Backend maps this to requirement.targetRole.
        supplierType,
      };

      const result = await http.post("/requirements", payload);

      const requirement = getRequirementFromResponse(result);

      if (!requirement) {
        console.error(
          "Unexpected create requirement response:",
          result
        );

        throw new Error(
          "Requirement was submitted, but the server returned an unexpected response."
        );
      }

      const requirementId = requirement.id || requirement._id;

      if (!requirementId) {
        console.error(
          "Created requirement has no ID:",
          requirement
        );

        throw new Error(
          "Requirement was created, but its ID could not be found."
        );
      }

      navigate(`/requirements/${requirementId}`, {
        replace: true,
      });
    } catch (err) {
      console.error("Create requirement error:", err);

      setError(
        getApiMessage(
          err,
          "Unable to create the requirement. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  if (user && !canCreateRequirement) {
    return (
      <Navigate
        to={isCompanyRole ? "/opportunities" : "/requirements"}
        replace
      />
    );
  }

  return (
    <div className="min-h-full space-y-7">
      {/* Header */}
      <div className="rounded-[22px] border border-[#E9E2EA] bg-white p-5 shadow-[0_8px_28px_rgba(42,27,61,0.04)] sm:p-7">
        <Link
          to="/requirements"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#44318D] transition-colors hover:text-[#D83F87]"
        >
          <ArrowLeft size={16} />
          Back to requirements
        </Link>

        <div className="mt-5 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F8F2F5] text-primary">
            <FileText size={23} />
          </div>

          <div>
            <h1 className="font-['Cinzel'] text-2xl font-semibold text-[#2A1B3D] sm:text-3xl">
              {isMRSupportRequest
                ? "Request MR Support"
                : "Create Requirement"}
            </h1>

            <p className="mt-1.5 max-w-2xl font-['Fauna_One'] text-xs leading-6 text-[#6E6658]">
              {isMRSupportRequest
                ? "Ask a Medical Representative for product information, a pharmacy visit, or other professional support. Medicine and stock orders should be sent to a company or distributor."
                : "Tell the PharmUnis network what your pharmacy needs. Select the supplier type you want to reach, and your requirement will be matched only with relevant profiles."}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Main form */}
          <Card className="overflow-hidden border-[#E9E2EA] bg-white p-0 shadow-[0_8px_28px_rgba(42,27,61,0.04)]">
            <div className="border-b border-[#E9E6EC] px-6 py-5">
              <div className="flex items-center gap-2">
                <Sparkles
                  size={17}
                  className="text-[#D83F87]"
                />

                <h2 className="font-['Cinzel'] text-base font-semibold text-[#2A1B3D]">
                  {isMRSupportRequest
                    ? "Support request details"
                    : "Requirement details"}
                </h2>
              </div>

              <p className="mt-1 text-xs text-[#8C8496]">
                {isMRSupportRequest
                  ? "Select the therapeutic area and explain what support would help your pharmacy."
                  : "Provide enough information for the selected supplier type to understand what you need."}
              </p>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block font-['Philosopher'] text-sm uppercase tracking-wide text-[#2A1B3D]"
                >
                  {isMRSupportRequest
                    ? "Therapeutic area"
                    : "Product category"}
                </label>

                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-[#E5DEE7] bg-[#FCFAF8] px-4 py-3 font-['Fauna_One'] text-sm text-[#2A1B3D] outline-none transition focus:border-[#D83F87] focus:ring-2 focus:ring-[#D83F87]/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {categoryOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {isMRSupportRequest && (
                <div>
                  <label
                    htmlFor="requestType"
                    className="mb-2 block font-['Philosopher'] text-sm uppercase tracking-wide text-[#2A1B3D]"
                  >
                    Type of support
                  </label>

                  <select
                    id="requestType"
                    value={requestType}
                    onChange={(event) => setRequestType(event.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-[#E5DEE7] bg-[#FCFAF8] px-4 py-3 font-['Fauna_One'] text-sm text-[#2A1B3D] outline-none transition focus:border-[#D83F87] focus:ring-2 focus:ring-[#D83F87]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {MR_SUPPORT_REQUEST_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block font-['Philosopher'] text-sm uppercase tracking-wide text-[#2A1B3D]"
                >
                  {isMRSupportRequest ? "Request title" : "Requirement title"}
                </label>

                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  placeholder={
                    isMRSupportRequest
                      ? "e.g. Product information meeting for cardiology"
                      : "e.g. Monthly requirement for cardiac medicines"
                  }
                  className="w-full rounded-xl border border-[#E5DEE7] bg-[#FCFAF8] px-4 py-3 font-['Fauna_One'] text-sm text-[#2A1B3D] outline-none transition placeholder:text-[#9A929F] focus:border-[#D83F87] focus:ring-2 focus:ring-[#D83F87]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block font-['Philosopher'] text-sm uppercase tracking-wide text-[#2A1B3D]"
                >
                  {isMRSupportRequest
                    ? "Support needed"
                    : "Requirement description"}
                </label>

                <textarea
                  id="description"
                  rows={7}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  placeholder={
                    isMRSupportRequest
                      ? "Describe the product information, discussion, or pharmacy visit you need. Do not use this request to order medicines or stock."
                      : "Describe the products, approximate quantity, preferred brands, delivery requirements, or any other useful information..."
                  }
                  className="w-full resize-none rounded-xl border border-[#E5DEE7] bg-[#FCFAF8] px-4 py-3 font-['Fauna_One'] text-sm leading-6 text-[#2A1B3D] outline-none transition placeholder:text-[#9A929F] focus:border-[#D83F87] focus:ring-2 focus:ring-[#D83F87]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <div className="mt-2 flex justify-end text-xs text-[#8C8496]">
                  {description.length} characters
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="mb-3 block font-['Philosopher'] text-sm uppercase tracking-wide text-[#2A1B3D]">
                  Urgency
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {URGENCY_OPTIONS.map((option) => {
                    const active = urgency === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={loading}
                        onClick={() => setUrgency(option.value)}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          active
                            ? "border-[#D83F87] bg-[#D83F87]/5 shadow-sm"
                            : "border-[#E9E6EC] bg-white hover:border-[#44318D]/30 hover:bg-[#F8F7F9]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`font-['Philosopher'] text-sm uppercase ${
                              active
                                ? "text-[#D83F87]"
                                : "text-[#2A1B3D]"
                            }`}
                          >
                            {option.label}
                          </span>

                          {active && (
                            <CheckCircle2
                              size={17}
                              className="text-[#D83F87]"
                            />
                          )}
                        </div>

                        <p className="mt-2 font-['Fauna_One'] text-xs leading-5 text-[#6E6658]">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-[#E9E6EC] pt-6 sm:flex-row sm:justify-end">
                <Link
                  to="/requirements"
                  className={`inline-flex items-center justify-center rounded-full border border-[#E9E2EA] px-5 py-3 font-['Philosopher'] text-[10px] uppercase tracking-wide text-[#2A1B3D] transition hover:bg-[#FCFAF8] ${
                    loading
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                >
                  Cancel
                </Link>

                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  {isMRSupportRequest
                    ? "Send support request"
                    : "Create requirement"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-5">
            <Card className="border-[#E9E2EA] bg-white shadow-[0_8px_28px_rgba(42,27,61,0.04)]">
              <div className="flex items-center gap-2">
                <Users
                  size={18}
                  className="text-[#44318D]"
                />

                <h3 className="font-['Cinzel'] text-base font-semibold text-[#2A1B3D]">
                  Who should receive it?
                </h3>
              </div>

              <p className="mt-2 font-['Fauna_One'] text-xs leading-5 text-[#A4B3B6]">
                Select who should receive this request. Medicine and stock
                orders go to companies or distributors; MR requests are for
                professional support.
              </p>

              <div className="mt-4 space-y-3">
                {availableSupplierTypes.map((item) => {
                  const Icon = item.icon;
                  const active = supplierType === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      disabled={loading}
                      onClick={() => handleSupplierTypeChange(item.value)}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${
                        active
                          ? "border-[#D83F87] bg-[#D83F87]/5"
                          : "border-[#E9E6EC] hover:border-[#44318D]/30 hover:bg-[#F8F7F9]"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            active
                              ? "bg-[#D83F87] text-white"
                              : "bg-[#44318D]/10 text-[#44318D]"
                          }`}
                        >
                          <Icon size={17} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-['Philosopher'] text-xs uppercase tracking-wide text-[#2A1B3D]">
                              {item.label}
                            </span>

                            {active && (
                              <CheckCircle2
                                size={14}
                                className="text-[#D83F87]"
                              />
                            )}
                          </div>

                          <p className="mt-1 font-['Fauna_One'] text-[11px] leading-5 text-[#A4B3B6]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl bg-[#F8F7F9] p-3">
                <p className="font-['Fauna_One'] text-[11px] leading-5 text-[#A4B3B6]">
                  {isMRSupportRequest
                    ? "Medical Representatives are matched using the selected therapeutic area and their territory. This request is for professional support, not medicine supply."
                    : "Only profiles belonging to the selected supplier type should be considered for this requirement. Matching profiles and match details remain private to the pharmacy that created the requirement."}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}