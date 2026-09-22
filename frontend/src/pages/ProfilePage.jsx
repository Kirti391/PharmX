import { useEffect, useState } from "react";
import { http, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Card, Input, Label, Select, TextArea, Loader } from "../components/ui";
import { Button } from "../components/ui";
import { PRODUCT_CATEGORIES } from "../lib/constants";

function TagInput({ label, values, onChange, placeholder }) {
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

function SaveBar({ saved, error }) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit">Save changes</Button>
      {saved && <span className="text-tealdeep text-sm">Saved ✓</span>}
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Loader />;
  if (user.role === "MR" || user.role === "INDEPENDENT_MR") return <MRProfileForm />;
  if (user.role === "PHARMA_COMPANY") return <PharmaProfileForm />;
  if (user.role === "PHARMACY") return <PharmacyProfileForm />;
  if (user.role === "STOCKIST" || user.role === "DISTRIBUTOR") return <StockistProfileForm />;
  return <p className="text-taupe">No profile type for this role.</p>;
}

function MRProfileForm() {
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    http.get("/profiles/mr/me").then(setProfile).catch(() => {});
  }, []);
  if (!profile) return <Loader />;

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const updated = await http.patch("/profiles/mr/me", profile);
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to save"));
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-navy mb-6">My MR Profile</h1>
      <Card>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>Full name</Label>
            <Input value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
          </div>
          <div>
            <Label>Bio</Label>
            <TextArea rows={3} value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Experience (years)</Label>
              <Input
                type="number"
                min={0}
                value={profile.experienceYears}
                onChange={(e) => setProfile({ ...profile, experienceYears: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Work mode</Label>
              <Select value={profile.workMode} onChange={(e) => setProfile({ ...profile, workMode: e.target.value })}>
                <option value="FIELD">Field</option>
                <option value="HYBRID">Hybrid</option>
                <option value="REMOTE">Remote</option>
              </Select>
            </div>
          </div>
          <div>
            <Label>Availability</Label>
            <Select value={profile.availabilityStatus} onChange={(e) => setProfile({ ...profile, availabilityStatus: e.target.value })}>
              <option value="AVAILABLE">Available</option>
              <option value="BUSY">Busy</option>
              <option value="ON_LEAVE">On leave</option>
            </Select>
          </div>
          <TagInput label="Languages" values={profile.languages} onChange={(v) => setProfile({ ...profile, languages: v })} placeholder="e.g. Hindi" />
          <TagInput
            label="Specializations"
            values={profile.specializations}
            onChange={(v) => setProfile({ ...profile, specializations: v })}
            placeholder="Pick from: Dermatology, Cardiology…"
          />
          <TagInput
            label="Preferred territories"
            values={profile.territories}
            onChange={(v) => setProfile({ ...profile, territories: v })}
            placeholder="e.g. Karnal, Haryana"
          />
          <div>
            <Label>Companies represented</Label>
            <Input
              value={profile.companiesRepresented ?? ""}
              onChange={(e) => setProfile({ ...profile, companiesRepresented: e.target.value })}
              placeholder="Free text for MVP"
            />
          </div>
          <SaveBar saved={saved} error={error} />
        </form>
      </Card>
      <p className="text-xs text-taupe mt-3">Suggested categories: {PRODUCT_CATEGORIES.join(", ")}</p>
    </div>
  );
}

function PharmaProfileForm() {
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    http.get("/profiles/pharma/me").then(setProfile).catch(() => {});
  }, []);
  if (!profile) return <Loader />;

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const updated = await http.patch("/profiles/pharma/me", profile);
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to save"));
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-navy mb-6">My Company Profile</h1>
      <Card>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>Company name</Label>
            <Input value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} />
          </div>
          <div>
            <Label>Description</Label>
            <TextArea rows={3} value={profile.description ?? ""} onChange={(e) => setProfile({ ...profile, description: e.target.value })} />
          </div>
          <div>
            <Label>Manufacturing location</Label>
            <Input value={profile.manufacturingLocation ?? ""} onChange={(e) => setProfile({ ...profile, manufacturingLocation: e.target.value })} />
          </div>
          <TagInput
            label="Areas of operation"
            values={profile.areasOfOperation}
            onChange={(v) => setProfile({ ...profile, areasOfOperation: v })}
            placeholder="e.g. Haryana"
          />
          <TagInput
            label="Product categories"
            values={profile.productCategories}
            onChange={(v) => setProfile({ ...profile, productCategories: v })}
            placeholder="e.g. Dermatology"
          />
          <SaveBar saved={saved} error={error} />
        </form>
      </Card>
      <p className="text-xs text-taupe mt-3">Suggested categories: {PRODUCT_CATEGORIES.join(", ")}</p>
    </div>
  );
}

function PharmacyProfileForm() {
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    http.get("/profiles/pharmacy/me").then(setProfile).catch(() => {});
  }, []);
  if (!profile) return <Loader />;

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const updated = await http.patch("/profiles/pharmacy/me", profile);
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to save"));
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-navy mb-6">My Pharmacy Profile</h1>
      {profile.businessVerified && <p className="text-tealdeep text-sm mb-4">✓ Business verified</p>}
      <Card>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>Pharmacy name</Label>
            <Input value={profile.pharmacyName} onChange={(e) => setProfile({ ...profile, pharmacyName: e.target.value })} />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
          </div>
          <TagInput
            label="Interested product categories"
            values={profile.interestedCategories}
            onChange={(v) => setProfile({ ...profile, interestedCategories: v })}
            placeholder="e.g. Dermatology"
          />
          <SaveBar saved={saved} error={error} />
        </form>
      </Card>
      <p className="text-xs text-taupe mt-3">Suggested categories: {PRODUCT_CATEGORIES.join(", ")}</p>
    </div>
  );
}

function StockistProfileForm() {
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    http.get("/profiles/stockist/me").then(setProfile).catch(() => {});
  }, []);
  if (!profile) return <Loader />;

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const updated = await http.patch("/profiles/stockist/me", profile);
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to save"));
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-navy mb-6">
        My {profile.type === "DISTRIBUTOR" ? "Distributor" : "Stockist"} Profile
      </h1>
      {profile.businessVerified && <p className="text-tealdeep text-sm mb-4">✓ Business verified</p>}
      <Card>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>Company name</Label>
            <Input value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} />
          </div>
          <TagInput label="Service areas" values={profile.serviceAreas} onChange={(v) => setProfile({ ...profile, serviceAreas: v })} placeholder="e.g. Haryana" />
          <TagInput
            label="Product categories"
            values={profile.productCategories}
            onChange={(v) => setProfile({ ...profile, productCategories: v })}
            placeholder="e.g. Dermatology"
          />
          <TagInput
            label="Associated companies"
            values={profile.associatedCompanies}
            onChange={(v) => setProfile({ ...profile, associatedCompanies: v })}
            placeholder="Free text for MVP"
          />
          <SaveBar saved={saved} error={error} />
        </form>
      </Card>
      <p className="text-xs text-taupe mt-3">Suggested categories: {PRODUCT_CATEGORIES.join(", ")}</p>
    </div>
  );
}
