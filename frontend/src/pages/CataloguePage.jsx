import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  Loader,
  Select,
  StatusBadge,
  TextArea,
} from "../components/ui";
import { apiErrorMessage, http } from "../lib/api";
import { PRODUCT_CATEGORIES } from "../lib/constants";
import { useAuthStore } from "../store/authStore";

const EMPTY_PRODUCT = {
  name: "",
  category: "",
  activeIngredient: "",
  strength: "",
  dosageForm: "",
  packSize: "",
  description: "",
};

function ProductCard({ product, onEdit, onStatusChange, canManage }) {
  return (
    <Card className="group flex h-full flex-col gap-4 overflow-hidden border-[#E9E2EA] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(42,27,61,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-navy">{product.name}</h2>
          <p className="mt-1 text-xs text-[#8C8496]">{product.companyName || "Verified company"}</p>
        </div>
        {canManage && <StatusBadge status={product.status} />}
      </div>
      <p className="inline-flex w-fit rounded-full bg-[#F8F2F5] px-3 py-1 font-nav text-[9px] uppercase tracking-[0.1em] text-primary">{product.category}</p>
      {(product.activeIngredient || product.strength || product.dosageForm || product.packSize) && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-[#FCFAF8] p-4 text-xs">
          {[
            ["Ingredient", product.activeIngredient],
            ["Strength", product.strength],
            ["Dosage form", product.dosageForm],
            ["Pack size", product.packSize],
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label}>
                <dt className="font-nav text-[8px] uppercase tracking-[0.1em] text-[#8C8496]">{label}</dt>
                <dd className="mt-1 text-navy">{value}</dd>
              </div>
            ))}
        </dl>
      )}
      {product.description && (
        <p className="whitespace-pre-wrap text-xs leading-6 text-[#6E6658]">{product.description}</p>
      )}
      {canManage && (
        <div className="mt-auto flex flex-wrap gap-2 border-t border-[#E9E2EA] pt-4">
          <Button size="sm" variant="ghost" onClick={() => onEdit(product)}>Edit product</Button>
          {product.status === "PUBLISHED" ? (
            <Button size="sm" variant="ghost" onClick={() => onStatusChange(product, "ARCHIVED")}>Archive</Button>
          ) : (
            product.status !== "ARCHIVED" && (
              <Button size="sm" variant="secondary" onClick={() => onStatusChange(product, "PUBLISHED")}>Publish</Button>
            )
          )}
        </div>
      )}
    </Card>
  );
}

export default function CataloguePage() {
  const user = useAuthStore((state) => state.user);
  const isCompany = user?.role === "PHARMA_COMPANY";
  const [products, setProducts] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [product, setProduct] = useState(EMPTY_PRODUCT);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    const requests = [http.get("/catalogue/products", { params })];
    if (isCompany) requests.push(http.get("/catalogue/products/mine"));
    const [published, owned = []] = await Promise.all(requests);
    return { published, owned };
  }, [isCompany]);

  const loadData = useCallback(async (filters = {}) => {
    const { published, owned } = await fetchData(filters);
    setProducts(published);
    setMyProducts(owned);
  }, [fetchData]);

  useEffect(() => {
    let mounted = true;
    fetchData()
      .then(({ published, owned }) => {
        if (!mounted) return;
        setProducts(published);
        setMyProducts(owned);
      })
      .catch((requestError) => {
        if (!mounted) return;
        setError(apiErrorMessage(requestError, "Unable to load the product catalogue."));
        setProducts([]);
      });
    return () => {
      mounted = false;
    };
  }, [fetchData]);

  function updateProduct(field, value) {
    setProduct((current) => ({ ...current, [field]: value }));
  }

  function editProduct(item) {
    setEditingId(item.id);
    setProduct({
      name: item.name || "",
      category: item.category || "",
      activeIngredient: item.activeIngredient || "",
      strength: item.strength || "",
      dosageForm: item.dosageForm || "",
      packSize: item.packSize || "",
      description: item.description || "",
    });
    setFormOpen(true);
  }

  function resetForm() {
    setFormOpen(false);
    setEditingId("");
    setProduct(EMPTY_PRODUCT);
  }

  async function applyFilters(event) {
    event.preventDefault();
    setError("");
    setActiveSearch(search.trim());
    setActiveCategory(category);
    try {
      await loadData({ search: search.trim(), category });
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to search the catalogue."));
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (editingId) {
        await http.patch(`/catalogue/products/${editingId}`, product);
      } else {
        await http.post("/catalogue/products", product);
      }
      resetForm();
      await loadData({ search: activeSearch, category: activeCategory });
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to save the product."));
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(item, status) {
    setError("");
    try {
      await http.patch(`/catalogue/products/${item.id}/status`, { status });
      await loadData({ search: activeSearch, category: activeCategory });
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to update product status."));
    }
  }

  if (products === null) return <Loader />;

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-center justify-between gap-5 rounded-[22px] border border-[#E9E2EA] bg-white px-5 py-6 shadow-[0_8px_28px_rgba(42,27,61,0.04)] sm:px-8">
        <div>
          <p className="font-nav text-[9px] uppercase tracking-[0.18em] text-primary">PharmUnis marketplace</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-navy sm:text-3xl">Product catalogue</h1>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-[#6E6658]">
            Browse products published by verified pharmaceutical companies. This catalogue is informational only; PharmX does not process medicine orders, prescriptions, inventory, or payments.
          </p>
        </div>
        {isCompany && (
          <Button onClick={() => (formOpen ? resetForm() : setFormOpen(true))}>
            {formOpen ? <><X size={16} /> Cancel</> : "Add product"}
          </Button>
        )}
      </header>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <Card className="border-[#E9E2EA] p-5 sm:p-6">
        <form onSubmit={applyFilters} className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_240px_auto]">
          <div>
            <Label htmlFor="catalogue-search">Search products</Label>
            <Input id="catalogue-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, ingredient, or description" maxLength={100} />
          </div>
          <div>
            <Label htmlFor="catalogue-category">Category</Label>
            <Select id="catalogue-category" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {PRODUCT_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </div>
          <Button type="submit" className="self-end"><Search size={16} /> Search</Button>
        </form>
      </Card>

      {isCompany && formOpen && (
        <Card>
          <form onSubmit={saveProduct} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="product-name">Product name</Label>
              <Input id="product-name" value={product.name} onChange={(event) => updateProduct("name", event.target.value)} minLength={2} maxLength={160} required />
            </div>
            <div>
              <Label htmlFor="product-category">Category</Label>
              <Select id="product-category" value={product.category} onChange={(event) => updateProduct("category", event.target.value)} required>
                <option value="">Select category</option>
                {PRODUCT_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="product-ingredient">Active ingredient (optional)</Label>
              <Input id="product-ingredient" value={product.activeIngredient} onChange={(event) => updateProduct("activeIngredient", event.target.value)} maxLength={200} />
            </div>
            <div>
              <Label htmlFor="product-strength">Strength (optional)</Label>
              <Input id="product-strength" value={product.strength} onChange={(event) => updateProduct("strength", event.target.value)} maxLength={120} />
            </div>
            <div>
              <Label htmlFor="product-form">Dosage form (optional)</Label>
              <Input id="product-form" value={product.dosageForm} onChange={(event) => updateProduct("dosageForm", event.target.value)} maxLength={120} />
            </div>
            <div>
              <Label htmlFor="product-pack">Pack size (optional)</Label>
              <Input id="product-pack" value={product.packSize} onChange={(event) => updateProduct("packSize", event.target.value)} maxLength={120} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="product-description">Product information (optional)</Label>
              <TextArea id="product-description" value={product.description} onChange={(event) => updateProduct("description", event.target.value)} rows={3} maxLength={2000} />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" loading={busy}>{editingId ? "Save changes" : "Save as draft"}</Button>
              <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {isCompany && (
        <section className="space-y-4">
          <h2 className="border-l-[3px] border-primary pl-3 font-display text-lg font-semibold text-navy">Your catalogue <span className="font-nav text-xs text-[#8C8496]">({myProducts.length})</span></h2>
          {myProducts.length === 0 ? (
            <Card><EmptyState title="No products yet" subtitle="Add product details as a draft, then publish them after your company is verified." /></Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {myProducts.map((item) => (
                <ProductCard key={item.id} product={item} canManage onEdit={editProduct} onStatusChange={changeStatus} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <h2 className="border-l-[3px] border-purple pl-3 font-display text-lg font-semibold text-navy">Published products <span className="font-nav text-xs text-[#8C8496]">({products.length})</span></h2>
        {products.length === 0 ? (
          <Card><EmptyState title="No published products found" subtitle="Try another search or category, or check back after companies publish their catalogues." /></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {products.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                canManage={false}
                onEdit={editProduct}
                onStatusChange={changeStatus}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
