import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../../lib/api";
import type { Category, Product } from "../../lib/types";
import { mediaUrl } from "../../lib/utils";

const empty = {
  name: "",
  description: "",
  sku: "",
  price: "",
  salePrice: "",
  categoryId: "",
  gender: "WOMEN",
  stock: "0",
  colors: "",
  sizes: "",
  isFeatured: false,
  isActive: true,
  isNewArrival: false,
};

export function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [images, setImages] = useState<{ url: string }[]>([]);
  const categories = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () =>
      (await api.get<{ success: true; data: Category[] }>("/api/categories?includeInactive=true")).data,
  });
  const existing = useQuery({
    queryKey: ["admin-product", id],
    enabled: Boolean(id) && id !== "new",
    queryFn: async () => (await api.get<{ success: true; data: Product }>(`/api/products/${id}`)).data,
  });

  useEffect(() => {
    if (!existing.data) return;
    const product = existing.data;
    setForm({
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: product.price,
      salePrice: product.salePrice ?? "",
      categoryId: product.categoryId,
      gender: product.gender,
      stock: String(product.stock),
      colors: product.colors.join(", "),
      sizes: product.sizes.join(", "),
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      isNewArrival: product.isNewArrival,
    });
    setImages(product.images.map((image) => ({ url: image.url })));
  }, [existing.data]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const body = new FormData();
    Array.from(files).forEach((file) => body.append("files", file));
    const res = await api.post<{ success: true; data: { url: string }[] }>("/api/uploads", body);
    setImages((current) => [...current, ...res.data]);
  }

  async function save() {
    const payload = {
      name: form.name,
      description: form.description,
      sku: form.sku,
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      categoryId: form.categoryId,
      gender: form.gender,
      stock: Number(form.stock),
      colors: form.colors.split(",").map((v) => v.trim()).filter(Boolean),
      sizes: form.sizes.split(",").map((v) => v.trim()).filter(Boolean),
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      isNewArrival: form.isNewArrival,
      images,
    };
    if (id && id !== "new") await api.put(`/api/products/${id}`, payload);
    else await api.post("/api/products", payload);
    toast.success("Product saved");
    navigate("/admin/products");
  }

  const field = (key: keyof typeof empty, label: string, type = "text") => (
    <label className="block text-sm">
      {label}
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
      />
    </label>
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">{id === "new" || !id ? "New product" : "Edit product"}</h1>
      <div className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6">
        {field("name", "Name")}
        <label className="block text-sm">
          Description
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={5}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          {field("sku", "SKU")}
          {field("price", "Price", "number")}
          {field("salePrice", "Sale price", "number")}
          {field("stock", "Stock", "number")}
        </div>
        <label className="block text-sm">
          Category
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">Select</option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Gender
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="WOMEN">Women</option>
            <option value="MEN">Men</option>
            <option value="UNISEX">Unisex</option>
          </select>
        </label>
        {field("colors", "Colours (comma separated)")}
        {field("sizes", "Sizes / variants (comma separated)")}
        <div className="flex gap-4 text-sm">
          <label><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured</label>
          <label><input type="checkbox" checked={form.isNewArrival} onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })} /> New arrival</label>
          <label><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
        </div>
        <div>
          <p className="text-sm">Images</p>
          <input type="file" multiple accept="image/*" onChange={(e) => upload(e.target.files)} className="mt-2 text-sm" />
          <div className="mt-3 flex flex-wrap gap-3">
            {images.map((image) => (
              <div key={image.url} className="relative h-24 w-20">
                <img src={mediaUrl(image.url)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-1 top-1 bg-white px-1 text-xs"
                  onClick={() => setImages(images.filter((item) => item.url !== image.url))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <button onClick={save} className="rounded-lg bg-slate-900 px-4 py-2 text-white">
          Save product
        </button>
      </div>
    </div>
  );
}
