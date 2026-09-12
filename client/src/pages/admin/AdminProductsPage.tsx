import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../../lib/api";
import type { Product } from "../../lib/types";
import { formatMoney, mediaUrl } from "../../lib/utils";

export function AdminProductsPage() {
  const [q, setQ] = useState("");
  const client = useQueryClient();
  const products = useQuery({
    queryKey: ["admin-products", q],
    queryFn: async () =>
      (
        await api.get<{ success: true; data: Product[] }>(
          `/api/products?includeInactive=true&limit=48&q=${encodeURIComponent(q)}`
        )
      ).data,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/products/${id}`),
    onSuccess: () => {
      toast.success("Product updated");
      client.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link to="/admin/products/new" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
          New product
        </Link>
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name or SKU"
        className="mt-4 w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2"
      />
      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <table className="stack-table w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.data?.map((product) => (
              <tr key={product.id} className="border-t border-slate-100">
                <td className="px-4 py-3" data-label="Product">
                  <div className="flex items-center justify-end gap-3 md:justify-start">
                    <img src={mediaUrl(product.images[0]?.url)} alt="" className="h-12 w-10 object-cover" />
                    <div className="text-right md:text-left">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.category?.name}</p>
                    </div>
                  </div>
                </td>
                <td data-label="SKU">{product.sku}</td>
                <td data-label="Price">{formatMoney(product.salePrice ?? product.price)}</td>
                <td data-label="Stock">{product.stock}</td>
                <td data-label="Status">{product.isActive ? "Active" : "Hidden"}</td>
                <td className="space-x-3 px-4" data-label="">
                  <Link to={`/admin/products/${product.id}`} className="text-indigo-600">
                    Edit
                  </Link>
                  <button
                    className="text-red-600"
                    onClick={() => {
                      if (confirm("Delete or archive this product?")) remove.mutate(product.id);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
