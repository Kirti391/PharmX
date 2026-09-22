import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http, apiErrorMessage } from "../lib/api";
import { Card, Input, Label, Select, TextArea } from "../components/ui";
import { Button } from "../components/ui";
import { PRODUCT_CATEGORIES } from "../lib/constants";

export default function RequirementCreatePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("NORMAL");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await http.post("/requirements", { category, title, description, urgency });
      navigate(`/requirements/${result.requirement.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to post requirement"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold text-navy mb-6">Post a requirement</h1>
      <Card>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>Product category</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Looking for dermatology products" />
          </div>
          <div>
            <Label>Description</Label>
            <TextArea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Urgency</Label>
            <Select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
            </Select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" loading={loading}>
            Post requirement
          </Button>
        </form>
      </Card>
    </div>
  );
}
