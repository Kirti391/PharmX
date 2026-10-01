import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  MapPin,
  PackageSearch,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";

import { http, apiErrorMessage } from "../lib/api";
import {
  Card,
  Input,
  Label,
  Select,
  TextArea,
  Button,
} from "../components/ui";
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

const SUPPLIER_TYPES = [
  {
    value: "COMPANY",
    label: "Pharma Companies",
  },
  {
    value: "MR",
    label: "Medical Representatives",
  },
  {
    value: "DISTRIBUTOR_STOCKIST",
    label: "Distributors & Stockists",
  },
];

function FieldHint({ children }) {
  return (
    <p
      className="mt-1.5 font-[Fauna_One] text-[10px] leading-4"
      style={{ color: COLORS.muted }}
    >
      {children}
    </p>
  );
}

export default function RequirementCreatePage() {
  const navigate = useNavigate();

  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("NORMAL");
  const [supplierType, setSupplierType] = useState(
    "DISTRIBUTOR_STOCKIST"
  );

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();

    setError(null);

    if (!title.trim()) {
      setError("Please add a title for your requirement.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe what your pharmacy needs.");
      return;
    }

    setLoading(true);

    try {
      const result = await http.post("/requirements", {
        category,
        title: title.trim(),
        description: description.trim(),
        urgency,
        supplierType,
      });

      navigate(`/requirements/${result.requirement.id}`);
    } catch (err) {
      setError(
        apiErrorMessage(err, "Failed to create your requirement.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7 pb-10">
      {/* BACK */}
      <Link
        to="/requirements"
        className="inline-flex items-center gap-2 font-[Unica_One] text-[10px] uppercase tracking-[0.12em] transition hover:gap-3"
        style={{ color: COLORS.muted }}
      >
        <ArrowLeft size={14} />
        Back to Requirements
      </Link>

      {/* HERO */}
      <section
        className="relative overflow-hidden rounded-[26px] px-6 py-7 sm:px-8 lg:px-10 lg:py-9"
        style={{
          background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.purple} 100%)`,
        }}
      >
        <div
          className="absolute -right-20 -top-24 h-60 w-60 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: COLORS.primary }}
        />

        <div
          className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: COLORS.coral }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <PackageSearch
              size={17}
              className="text-white/60"
              strokeWidth={1.7}
            />

            <p className="font-[Unica_One] text-[10px] uppercase tracking-[0.2em] text-white/55">
              Procurement
            </p>
          </div>

          <h1 className="mt-3 font-[Cinzel] text-2xl font-semibold text-white sm:text-3xl">
            Tell PharmUnis what your pharmacy needs.
          </h1>

          <p className="mt-3 max-w-2xl font-[Fauna_One] text-sm leading-6 text-white/65">
            Create a procurement requirement and let relevant pharmaceutical
            partners discover your need.
          </p>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: FileText,
            title: "Describe",
            text: "Tell us what you need.",
          },
          {
            icon: Sparkles,
            title: "Match",
            text: "Find relevant partners.",
          },
          {
            icon: Send,
            title: "Connect",
            text: "Discuss and procure.",
          },
        ].map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className="rounded-2xl border bg-white p-4"
              style={{ borderColor: COLORS.border }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor:
                      index === 0
                        ? "#FCE8F1"
                        : index === 1
                          ? "#F1ECFA"
                          : "#FDF0ED",
                    color:
                      index === 0
                        ? COLORS.primary
                        : index === 1
                          ? COLORS.purple
                          : COLORS.coral,
                  }}
                >
                  <Icon size={16} />
                </div>

                <div>
                  <p
                    className="font-[Cinzel] text-xs font-semibold"
                    style={{ color: COLORS.navy }}
                  >
                    {step.title}
                  </p>

                  <p
                    className="mt-0.5 font-[Fauna_One] text-[10px]"
                    style={{ color: COLORS.muted }}
                  >
                    {step.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* FORM */}
      <Card
        className="overflow-hidden border-[#E9E6EC] bg-white p-0"
      >
        <div
          className="border-b px-6 py-5 sm:px-8"
          style={{ borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor: "#FCE8F1",
                color: COLORS.primary,
              }}
            >
              <FileText size={18} />
            </div>

            <div>
              <h2
                className="font-[Cinzel] text-base font-semibold"
                style={{ color: COLORS.navy }}
              >
                Requirement details
              </h2>

              <p
                className="mt-1 font-[Fauna_One] text-xs"
                style={{ color: COLORS.muted }}
              >
                Give potential partners enough information to understand your
                requirement.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-6 p-6 sm:p-8"
        >
          {/* CATEGORY */}
          <div>
            <Label>Product category</Label>

            <Select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {PRODUCT_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>

            <FieldHint>
              Choose the category that best describes the products you are
              looking for.
            </FieldHint>
          </div>

          {/* TITLE */}
          <div>
            <Label>Requirement title</Label>

            <Input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Need dermatology products for regular pharmacy supply"
            />

            <FieldHint>
              Keep it specific so relevant partners can understand the need
              quickly.
            </FieldHint>
          </div>

          {/* DESCRIPTION */}
          <div>
            <Label>What does your pharmacy need?</Label>

            <TextArea
              required
              rows={6}
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe the products, brands, molecules, quantities, preferred supply arrangement or any other useful information..."
            />

            <FieldHint>
              You can mention products, brands, expected quantities, preferred
              suppliers or other procurement details.
            </FieldHint>
          </div>

          {/* SUPPLIER TYPE */}
          <div>
            <Label>Preferred partner type</Label>

            <div className="grid gap-3 md:grid-cols-3">
              {SUPPLIER_TYPES.map((type) => {
                const selected = supplierType === type.value;

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSupplierType(type.value)}
                    className="group rounded-2xl border p-4 text-left transition-all duration-200"
                    style={{
                      borderColor: selected
                        ? COLORS.primary
                        : COLORS.border,
                      backgroundColor: selected
                        ? "#FFF7FA"
                        : "#FFFFFF",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: selected
                            ? "#FCE8F1"
                            : "#F8F7F9",
                          color: selected
                            ? COLORS.primary
                            : COLORS.muted,
                        }}
                      >
                        {type.value === "COMPANY" && (
                          <PackageSearch size={16} />
                        )}

                        {type.value === "MR" && (
                          <Users size={16} />
                        )}

                        {type.value === "DISTRIBUTOR_STOCKIST" && (
                          <MapPin size={16} />
                        )}
                      </div>

                      {selected && (
                        <CheckCircle2
                          size={17}
                          style={{ color: COLORS.primary }}
                        />
                      )}
                    </div>

                    <p
                      className="mt-3 font-[Cinzel] text-xs font-semibold"
                      style={{ color: COLORS.navy }}
                    >
                      {type.label}
                    </p>
                  </button>
                );
              })}
            </div>

            <FieldHint>
              You can change this later as your requirement develops.
            </FieldHint>
          </div>

          {/* URGENCY */}
          <div>
            <Label>Urgency</Label>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  value: "LOW",
                  label: "Low",
                  description: "Planning ahead",
                  background: "#F2F1F3",
                  color: COLORS.muted,
                },
                {
                  value: "NORMAL",
                  label: "Normal",
                  description: "Regular procurement",
                  background: "#F1ECFA",
                  color: COLORS.purple,
                },
                {
                  value: "HIGH",
                  label: "High",
                  description: "Need attention soon",
                  background: "#FCE8F1",
                  color: COLORS.primary,
                },
              ].map((item) => {
                const selected = urgency === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setUrgency(item.value)}
                    className="rounded-2xl border p-4 text-left transition-all duration-200"
                    style={{
                      borderColor: selected
                        ? item.color
                        : COLORS.border,
                      backgroundColor: selected
                        ? item.background
                        : "#FFFFFF",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="font-[Unica_One] text-[10px] uppercase tracking-[0.12em]"
                        style={{ color: item.color }}
                      >
                        {item.label}
                      </span>

                      {selected && (
                        <CheckCircle2
                          size={15}
                          style={{ color: item.color }}
                        />
                      )}
                    </div>

                    <p
                      className="mt-2 font-[Fauna_One] text-[10px]"
                      style={{ color: COLORS.muted }}
                    >
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ERROR */}
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

          {/* ACTIONS */}
          <div
            className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end"
            style={{ borderColor: COLORS.border }}
          >
            <Link to="/requirements">
              <button
                type="button"
                className="w-full rounded-xl border px-5 py-3 font-[Unica_One] text-xs uppercase tracking-[0.08em] transition hover:bg-[#F8F7F9] sm:w-auto"
                style={{
                  borderColor: COLORS.border,
                  color: COLORS.navy,
                }}
              >
                Cancel
              </button>
            </Link>

            <Button
              type="submit"
              loading={loading}
              className="w-full border-0 bg-[#D83F87] px-6 py-3 font-[Unica_One] text-xs uppercase tracking-[0.1em] text-white hover:bg-[#c93679] sm:w-auto"
            >
              <Plus size={16} />
              Post Requirement
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}