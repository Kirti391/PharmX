import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, Plus, X } from "lucide-react";

import { apiErrorMessage, http } from "../lib/api";
import {
  Button,
  Card,
  ErrorState,
  Input,
  Label,
  Loader,
  Select,
  TextArea,
} from "../components/ui";
import { OpportunityDescription } from "../components/opportunities/OpportunityDescription";

const EMPTY_LIST = [];

function TagField({ label, values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim();
    if (
      value &&
      !values.some((existing) => existing.toLowerCase() === value.toLowerCase())
    ) {
      onChange([...values, value]);
    }
    setDraft("");
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="mb-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E9E2EA] bg-[#F8F2F5] px-3 py-1.5 text-xs text-navy"
          >
            {value}
            <button
              type="button"
              onClick={() =>
                onChange(values.filter((existing) => existing !== value))
              }
              aria-label={`Remove ${value}`}
              className="rounded-full text-taupe hover:text-red-500"
            >
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
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
        <Button type="button" variant="ghost" size="sm" onClick={add}>
          <Plus size={14} />
          Add
        </Button>
      </div>
    </div>
  );
}

export default function OpportunityCreatePage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [type, setType] = useState("MR_HIRING");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState(EMPTY_LIST);
  const [territories, setTerritories] = useState(EMPTY_LIST);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOwner, setIsOwner] = useState(!isEditing);
  const [loadedOpportunityId, setLoadedOpportunityId] = useState(null);

  useEffect(() => {
    if (!id) return undefined;

    let mounted = true;
    http
      .get(`/opportunities/${id}`)
      .then((opportunity) => {
        if (!mounted) return;
        setLoadedOpportunityId(id);
        if (!opportunity.isOwner) {
          setIsOwner(false);
          setError("You can only edit opportunities created by your company.");
          return;
        }
        setIsOwner(true);
        setType(opportunity.type);
        setTitle(opportunity.title || "");
        setDescription(opportunity.description || "");
        setCategories(
          Array.isArray(opportunity.categories) ? opportunity.categories : []
        );
        setTerritories(
          Array.isArray(opportunity.territories) ? opportunity.territories : []
        );
      })
      .catch((requestError) => {
        if (mounted) {
          setLoadedOpportunityId(id);
          setIsOwner(false);
          setError(
            apiErrorMessage(requestError, "Unable to load this opportunity.")
          );
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const body = { type, title, description, categories, territories };
      const result = isEditing
        ? await http.patch(`/opportunities/${id}`, body)
        : await http.post("/opportunities", body);
      const opportunityId = isEditing ? result.id : result.opportunity.id;
      navigate(`/opportunities/${opportunityId}`);
    } catch (requestError) {
      setError(
        apiErrorMessage(
          requestError,
          isEditing ? "Failed to update opportunity." : "Failed to post opportunity."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || (isEditing && loadedOpportunityId !== id)) {
    return <Loader />;
  }
  if (isEditing && !isOwner) {
    return (
      <div className="space-y-4">
        <ErrorState
          title="This opportunity cannot be edited"
          message={
            error ||
            "You can only edit opportunities created by your company."
          }
        />
        <Link
          to="/opportunities"
          className="inline-flex font-nav text-xs uppercase tracking-[0.1em] text-[#44318D]"
        >
          Back to opportunities
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <header className="rounded-[22px] border border-[#E9E2EA] bg-white p-5 shadow-[0_8px_28px_rgba(42,27,61,0.04)] sm:p-7">
        <Link
          to="/opportunities"
          className="inline-flex items-center gap-2 font-nav text-[10px] uppercase tracking-[0.12em] text-[#8C8496] transition hover:text-[#44318D]"
        >
          <ArrowLeft size={14} />
          Back to opportunities
        </Link>
        <p className="mt-5 font-nav text-[9px] uppercase tracking-[0.18em] text-primary">
          Company pipeline
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-navy sm:text-3xl">
          {isEditing ? "Edit opportunity" : "Post an opportunity"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6E6658]">
          Share clear details so representatives and distribution partners can
          quickly understand the role, requirements, and territory.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <Card className="space-y-6 border-[#E9E2EA] p-5 sm:p-7">
          <div>
            <Label htmlFor="opportunity-type">Opportunity type</Label>
            <Select
              id="opportunity-type"
              required
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="MR_HIRING">MR Hiring</option>
              <option value="TERRITORY_EXPANSION">Territory Expansion</option>
              <option value="DISTRIBUTION">Distribution</option>
              <option value="PRODUCT_PROMOTION">Product Promotion</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="opportunity-title">Opportunity title</Label>
            <Input
              id="opportunity-title"
              required
              minLength={3}
              maxLength={150}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Field MR needed - Haryana dermatology line"
            />
            <p className="mt-1.5 text-xs text-[#8C8496]">
              Keep it specific: role or partnership, product area, and location.
            </p>
          </div>

          <div>
            <div className="flex items-end justify-between gap-3">
              <Label htmlFor="opportunity-description">Full description</Label>
              <span className="mb-1.5 text-[11px] text-[#8C8496]">
                {description.length}/10,000
              </span>
            </div>
            <TextArea
              id="opportunity-description"
              required
              minLength={5}
              maxLength={10000}
              rows={13}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={"Role overview:\nDescribe the opportunity and what makes it valuable.\n\nResponsibilities:\n- Main day-to-day work\n- Reporting or collaboration expectations\n\nRequirements:\n- Experience, qualifications, or product knowledge\n\nWhat you offer:\nCompensation, training, or support details."}
              className="min-h-72 resize-y leading-6"
              aria-describedby="description-help"
            />
            <p id="description-help" className="mt-2 text-xs leading-5 text-[#8C8496]">
              Use blank lines to separate sections. Lines beginning with "-" or
              "1." are displayed as formatted lists.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <TagField
              label="Product categories"
              values={categories}
              onChange={setCategories}
              placeholder="e.g. Dermatology"
            />
            <TagField
              label="Territories"
              values={territories}
              onChange={setTerritories}
              placeholder="e.g. Haryana"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E9E2EA] pt-5">
            <Link
              to="/opportunities"
              className="font-nav text-xs uppercase tracking-[0.1em] text-[#6E6658] hover:text-[#44318D]"
            >
              Cancel
            </Link>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? "Save changes" : "Post opportunity"}
            </Button>
          </div>
        </Card>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <Card className="border-[#E9E2EA] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFEBF9] text-[#44318D]">
                <BriefcaseBusiness size={18} />
              </span>
              <div>
                <p className="font-nav text-[9px] uppercase tracking-[0.14em] text-[#8C8496]">
                  Description preview
                </p>
                <h2 className="mt-1 font-display text-base font-semibold text-navy">
                  {title || "Your opportunity"}
                </h2>
              </div>
            </div>
            <div className="mt-5 border-t border-[#E9E2EA] pt-5">
              <OpportunityDescription description={description} />
            </div>
          </Card>

          <div className="rounded-[18px] border border-[#E9E2EA] bg-[#F7F5FA] p-5">
            <h2 className="font-display text-sm font-semibold text-navy">
              A helpful description includes
            </h2>
            <ul className="mt-3 space-y-2 font-body text-xs leading-5 text-[#6E6658]">
              <li>- A clear overview and the work involved</li>
              <li>- Experience, qualifications, or product knowledge</li>
              <li>- Territory, expectations, and support offered</li>
            </ul>
          </div>
        </aside>
      </form>
    </div>
  );
}
