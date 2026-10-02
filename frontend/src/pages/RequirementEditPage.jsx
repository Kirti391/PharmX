import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Save,
  AlertCircle,
} from "lucide-react";

import { http } from "../lib/api";
import { Card, Button, Loader } from "../components/ui";
// import { PRODUCT_CATEGORIES } from "../common/constants";
const PRODUCT_CATEGORIES = [
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

const URGENCY_OPTIONS = [
  {
    value: "LOW",
    label: "Low",
    description: "No immediate requirement",
  },
  {
    value: "NORMAL",
    label: "Normal",
    description: "Needed within the usual procurement cycle",
  },
  {
    value: "HIGH",
    label: "High",
    description: "Priority procurement requirement",
  },
];

function getApiMessage(error, fallback = "Something went wrong.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    error?.message ||
    fallback
  );
}

function getRequirementFromResponse(result) {
  if (!result) return null;

  if (result.requirement) {
    return result.requirement;
  }

  if (result.data?.requirement) {
    return result.data.requirement;
  }

  if (result.data?.id || result.data?._id) {
    return result.data;
  }

  if (result.id || result._id) {
    return result;
  }

  return null;
}

function normalizeProducts(requirement) {
  if (Array.isArray(requirement?.products)) {
    return requirement.products.join(", ");
  }

  if (Array.isArray(requirement?.molecules)) {
    return requirement.molecules.join(", ");
  }

  if (typeof requirement?.products === "string") {
    return requirement.products;
  }

  return "";
}

export default function RequirementEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [requirement, setRequirement] = useState(null);

  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("NORMAL");
  const [products, setProducts] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadRequirement() {
      try {
        setLoading(true);
        setError("");

        const result = await http.get(`/requirements/${id}`);

        const data = getRequirementFromResponse(result);

        if (!data) {
          throw new Error(
            "The server returned an unexpected requirement response."
          );
        }

        if (!mounted) return;

        setRequirement(data);
        setCategory(data.category || "");
        setTitle(data.title || "");
        setDescription(data.description || "");
        setUrgency(data.urgency || "NORMAL");
        setProducts(normalizeProducts(data));
      } catch (err) {
        console.error("Load requirement error:", err);

        if (!mounted) return;

        setError(
          getApiMessage(
            err,
            "Unable to load this requirement."
          )
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadRequirement();
    } else {
      setError("Requirement ID is missing.");
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!category) {
      setError("Please select a product category.");
      return;
    }

    if (cleanTitle.length < 3) {
      setError("Requirement title must be at least 3 characters.");
      return;
    }

    if (cleanDescription.length < 5) {
      setError("Requirement description must be at least 5 characters.");
      return;
    }

    try {
      setSaving(true);

      /*
       * These are exactly the fields supported by your current
       * backend updateSchema.
       */
      const payload = {
        category,
        title: cleanTitle,
        description: cleanDescription,
        urgency,
      };

      const result = await http.patch(`/requirements/${id}`, payload);

      const updatedRequirement = getRequirementFromResponse(result);

      if (!updatedRequirement) {
        console.error("Unexpected update response:", result);

        throw new Error(
          "Requirement was updated, but the server returned an unexpected response."
        );
      }

      const updatedId = updatedRequirement.id || updatedRequirement._id || id;

      navigate(`/requirements/${updatedId}`, {
        replace: true,
      });
    } catch (err) {
      console.error("Update requirement error:", err);

      setError(
        getApiMessage(
          err,
          "Unable to update the requirement. Please try again."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="max-w-2xl">
        <Link
          to="/requirements"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#44318D] hover:text-[#D83F87]"
        >
          <ArrowLeft size={16} />
          Back to requirements
        </Link>

        <Card className="mt-6 border-red-200 bg-red-50">
          <div className="flex gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <h2 className="font-['Cinzel'] font-semibold text-red-800">
                Unable to open requirement
              </h2>

              <p className="mt-1 font-['Fauna_One'] text-sm leading-6 text-red-700">
                {error || "The requirement could not be found."}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const isClosed =
    requirement.status === "FULFILLED" ||
    requirement.status === "CLOSED";

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={`/requirements/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#44318D] transition-colors hover:text-[#D83F87]"
        >
          <ArrowLeft size={16} />
          Back to requirement
        </Link>

        <div className="mt-5 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#44318D]/10 text-[#44318D]">
            <FileText size={23} />
          </div>

          <div>
            <h1 className="font-['Cinzel'] text-2xl font-semibold text-[#2A1B3D]">
              Edit Requirement
            </h1>

            <p className="mt-1.5 font-['Fauna_One'] text-sm leading-6 text-[#A4B3B6]">
              Update the procurement details of your requirement.
            </p>
          </div>
        </div>
      </div>

      {/* Closed warning */}
      {isClosed && (
        <div className="mb-6 flex gap-3 rounded-xl border border-[#E98074]/30 bg-[#E98074]/10 px-4 py-3">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0 text-[#E98074]"
          />

          <div>
            <p className="font-['Unica_One'] text-sm uppercase tracking-wide text-[#2A1B3D]">
              Requirement is {requirement.status}
            </p>

            <p className="mt-1 font-['Fauna_One'] text-xs leading-5 text-[#A4B3B6]">
              This requirement has already reached a final state. Your
              backend may reject changes to it.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="overflow-hidden border-[#E9E6EC] bg-white p-0 shadow-sm">
          <div className="border-b border-[#E9E6EC] px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-['Cinzel'] text-base font-semibold text-[#2A1B3D]">
                  Requirement details
                </h2>

                <p className="mt-1 text-xs text-[#A4B3B6]">
                  Keep the information accurate so matching suppliers receive
                  useful context.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-[#44318D]/10 px-3 py-1 font-['Unica_One'] text-xs uppercase tracking-wide text-[#44318D]">
                {requirement.status || "OPEN"}
              </span>
            </div>
          </div>

          <div className="space-y-6 p-6">
            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="mb-2 block font-['Unica_One'] text-sm uppercase tracking-wide text-[#2A1B3D]"
              >
                Product category
              </label>

              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-[#E9E6EC] bg-[#F8F7F9] px-4 py-3 font-['Fauna_One'] text-sm text-[#2A1B3D] outline-none transition focus:border-[#D83F87] focus:ring-2 focus:ring-[#D83F87]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Select category</option>

                {PRODUCT_CATEGORIES?.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="mb-2 block font-['Unica_One'] text-sm uppercase tracking-wide text-[#2A1B3D]"
              >
                Requirement title
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-[#E9E6EC] bg-[#F8F7F9] px-4 py-3 font-['Fauna_One'] text-sm text-[#2A1B3D] outline-none transition focus:border-[#D83F87] focus:ring-2 focus:ring-[#D83F87]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block font-['Unica_One'] text-sm uppercase tracking-wide text-[#2A1B3D]"
              >
                Requirement description
              </label>

              <textarea
                id="description"
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                className="w-full resize-none rounded-xl border border-[#E9E6EC] bg-[#F8F7F9] px-4 py-3 font-['Fauna_One'] text-sm leading-6 text-[#2A1B3D] outline-none transition focus:border-[#D83F87] focus:ring-2 focus:ring-[#D83F87]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="mt-2 flex justify-end text-xs text-[#A4B3B6]">
                {description.length} characters
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="mb-3 block font-['Unica_One'] text-sm uppercase tracking-wide text-[#2A1B3D]">
                Urgency
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {URGENCY_OPTIONS.map((option) => {
                  const active = urgency === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={saving}
                      onClick={() => setUrgency(option.value)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        active
                          ? "border-[#D83F87] bg-[#D83F87]/5 shadow-sm"
                          : "border-[#E9E6EC] bg-white hover:border-[#44318D]/30 hover:bg-[#F8F7F9]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-['Unica_One'] text-sm uppercase ${
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

                      <p className="mt-2 font-['Fauna_One'] text-xs leading-5 text-[#A4B3B6]">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products */}
            <div>
              <label
                htmlFor="products"
                className="mb-2 block font-['Unica_One'] text-sm uppercase tracking-wide text-[#2A1B3D]"
              >
                Products / molecules
                <span className="ml-2 font-['Fauna_One'] text-[10px] normal-case tracking-normal text-[#A4B3B6]">
                  Optional
                </span>
              </label>

              <input
                id="products"
                type="text"
                value={products}
                onChange={(e) => setProducts(e.target.value)}
                disabled={saving}
                placeholder="e.g. Atorvastatin, Pantoprazole, Metformin"
                className="w-full rounded-xl border border-[#E9E6EC] bg-[#F8F7F9] px-4 py-3 font-['Fauna_One'] text-sm text-[#2A1B3D] placeholder:text-[#A4B3B6] outline-none transition focus:border-[#D83F87] focus:ring-2 focus:ring-[#D83F87]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-2 font-['Fauna_One'] text-xs leading-5 text-[#A4B3B6]">
                Note: your current backend Requirement model does not persist
                this field yet. It is displayed here for the UI, but the
                current PATCH request intentionally sends only fields your
                backend supports.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <p className="font-['Fauna_One'] text-sm leading-5 text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#E9E6EC] pt-6 sm:flex-row sm:justify-end">
              <Link
                to={`/requirements/${id}`}
                className={`inline-flex items-center justify-center rounded-xl border border-[#E9E6EC] px-5 py-3 font-['Unica_One'] text-sm uppercase tracking-wide text-[#2A1B3D] transition hover:bg-[#F8F7F9] ${
                  saving ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Cancel
              </Link>

              <Button
                type="submit"
                loading={saving}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Save changes
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}