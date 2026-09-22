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
          <span key={v} className="bg-navy/5 text-navy text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
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
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold text-navy mb-6">Post an opportunity</h1>
      <Card>
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
