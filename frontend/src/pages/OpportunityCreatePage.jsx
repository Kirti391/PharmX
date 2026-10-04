import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http, apiErrorMessage } from "../lib/api";
import { Card, Input, Label, Select, TextArea } from "../components/ui";
import { Button } from "../components/ui";

function TagField({ label, values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  }
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1.5 rounded-full bg-[#F8F2F5] px-3 py-1.5 text-xs text-navy">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="text-taupe hover:text-red-500">
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="ghost" size="sm" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}

export default function OpportunityCreatePage() {
  const navigate = useNavigate();
  const [type, setType] = useState("MR_HIRING");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await http.post("/opportunities", { type, title, description, categories, territories });
      navigate(`/opportunities/${result.opportunity.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to post opportunity"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header className="rounded-[22px] border border-[#E9E2EA] bg-white p-5 shadow-[0_8px_28px_rgba(42,27,61,0.04)] sm:p-7">
        <p className="font-nav text-[9px] uppercase tracking-[0.18em] text-primary">Professional network</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-navy sm:text-3xl">Post an opportunity</h1>
        <p className="mt-2 text-xs leading-6 text-[#6E6658]">Share a professional opportunity with relevant representatives and partners.</p>
      </header>
      <Card className="border-[#E9E2EA] p-5 sm:p-7">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>Opportunity type</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="MR_HIRING">MR Hiring</option>
              <option value="TERRITORY_EXPANSION">Territory Expansion</option>
              <option value="DISTRIBUTION">Distribution</option>
              <option value="PRODUCT_PROMOTION">Product Promotion</option>
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Field MR needed — Haryana dermatology line" />
          </div>
          <div>
            <Label>Description</Label>
            <TextArea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <TagField label="Categories" values={categories} onChange={setCategories} placeholder="e.g. Dermatology" />
          <TagField label="Territories" values={territories} onChange={setTerritories} placeholder="e.g. Haryana" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" loading={loading}>
            Post opportunity
          </Button>
        </form>
      </Card>
    </div>
  );
}
