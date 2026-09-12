import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";
import { toast } from "sonner";
import { api } from "../../lib/api";
import type { Category } from "../../lib/types";
import { formatMoney } from "../../lib/utils";

export function AdminCategoriesPage() {
  const client = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "", isActive: true });
  const categories = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () =>
      (await api.get<{ success: true; data: Category[] }>("/api/categories?includeInactive=true")).data,
  });
  const save = useMutation({
    mutationFn: () =>
      editId ? api.put(`/api/categories/${editId}`, form) : api.post("/api/categories", form),
    onSuccess: () => {
      toast.success("Category saved");
      client.invalidateQueries({ queryKey: ["admin-categories"] });
      setEditId(null);
      setForm({ name: "", description: "", imageUrl: "", isActive: true });
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h1 className="text-2xl font-semibold">Categories</h1>
        <div className="mt-4 rounded-xl border bg-white p-5">
          {categories.data?.map((category) => (
            <div key={category.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3 text-sm">
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-slate-500">{category.slug}</p>
              </div>
              <div className="flex gap-3">
                <span>{category.isActive ? "Active" : "Hidden"}</span>
                <button
                  className="text-indigo-600"
                  onClick={() => {
                    setEditId(category.id);
                    setForm({
                      name: category.name,
                      description: category.description,
                      imageUrl: category.imageUrl ?? "",
                      isActive: category.isActive,
                    });
                  }}
                >
                  Edit
                </button>
                <button
                  className="text-red-600"
                  onClick={async () => {
                    if (!confirm("Delete this category?")) return;
                    try {
                      await api.delete(`/api/categories/${category.id}`);
                      toast.success("Category deleted");
                      client.invalidateQueries({ queryKey: ["admin-categories"] });
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Cannot delete");
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <form
        className="rounded-xl border bg-white p-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <h2 className="font-medium">{editId ? "Edit category" : "New category"}</h2>
        <input className="mt-3 w-full rounded-lg border px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea className="mt-3 w-full rounded-lg border px-3 py-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
        </label>
        <button className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white">{editId ? "Update" : "Create"}</button>
      </form>
    </div>
  );
}

export function AdminCustomersPage() {
  const [q, setQ] = useState("");
  const customers = useQuery({
    queryKey: ["customers", q],
    queryFn: async () =>
      (
        await api.get<{
          success: true;
          data: { id: string; fullName: string; phone: string; email?: string; totalOrders: number; totalSpending: string; lastOrderDate?: string }[];
        }>(`/api/customers?q=${encodeURIComponent(q)}`)
      ).data,
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Customers</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="mt-4 w-full max-w-sm rounded-lg border px-3 py-2" />
      <div className="mt-6 rounded-xl border bg-white">
        <table className="stack-table w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Spent</th>
            </tr>
          </thead>
          <tbody>
            {customers.data?.map((customer) => (
              <tr key={customer.id} className="border-t">
                <td className="px-4 py-3" data-label="Name">
                  <Link className="text-indigo-600" to={`/admin/customers/${customer.id}`}>
                    {customer.fullName}
                  </Link>
                </td>
                <td data-label="Phone">{customer.phone}</td>
                <td data-label="Orders">{customer.totalOrders}</td>
                <td data-label="Spent">{formatMoney(customer.totalSpending)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminCustomerDetailPage() {
  const { id } = useParams();
  const customer = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => (await api.get<{ success: true; data: Record<string, unknown> }>(`/api/customers/${id}`)).data,
  });
  if (!customer.data) return <p>Loading…</p>;
  const data = customer.data as {
    fullName: string;
    phone: string;
    email?: string;
    totalOrders: number;
    totalSpending: string;
    orders: { id: string; orderNumber: string; total: string; status: string }[];
  };
  return (
    <div>
      <h1 className="text-2xl font-semibold">{data.fullName}</h1>
      <p className="text-sm text-slate-500">
        {data.phone} · {data.email} · {data.totalOrders} orders · {formatMoney(data.totalSpending)}
      </p>
      <div className="mt-6 rounded-xl border bg-white">
        {data.orders.map((order) => (
          <Link key={order.id} to={`/admin/orders/${order.id}`} className="flex justify-between border-b px-4 py-3 text-sm">
            <span>{order.orderNumber}</span>
            <span>
              {order.status} · {formatMoney(order.total)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function AdminInventoryPage() {
  const [filter, setFilter] = useState("all");
  const [reason, setReason] = useState("Manual adjustment");
  const client = useQueryClient();
  const inventory = useQuery({
    queryKey: ["inventory", filter],
    queryFn: async () =>
      (await api.get<{ success: true; data: { id: string; name: string; sku: string; stock: number; status: string }[] }>(`/api/inventory?filter=${filter}`)).data,
  });
  const history = useQuery({
    queryKey: ["inventory-history"],
    queryFn: async () =>
      (await api.get<{ success: true; data: { id: string; reason: string; previousQuantity: number; newQuantity: number; createdAt: string; product: { name: string } }[] }>("/api/inventory/history")).data,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Inventory</h1>
      <div className="mt-4 flex gap-2">
        {["all", "low", "out"].map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`rounded-lg border px-3 py-1 text-sm ${filter === item ? "bg-slate-900 text-white" : ""}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-xl border bg-white">
        <table className="stack-table w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th>SKU</th>
              <th>Stock</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {inventory.data?.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="px-4 py-3" data-label="Product">{product.name}</td>
                <td data-label="SKU">{product.sku}</td>
                <td data-label="Stock">{product.stock}</td>
                <td data-label="Update">
                  <form
                    className="flex gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const quantity = Number((e.currentTarget.elements.namedItem("qty") as HTMLInputElement).value);
                      await api.patch(`/api/inventory/${product.id}`, { quantity, reason });
                      toast.success("Stock updated");
                      client.invalidateQueries({ queryKey: ["inventory"] });
                      client.invalidateQueries({ queryKey: ["inventory-history"] });
                    }}
                  >
                    <input name="qty" type="number" defaultValue={product.stock} className="w-20 rounded border px-2 py-1" />
                    <button className="text-indigo-600">Save</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-4 rounded-lg border px-3 py-2 text-sm" />
      <h2 className="mt-8 font-medium">Stock history</h2>
      <div className="mt-3 rounded-xl border bg-white text-sm">
        {history.data?.map((entry) => (
          <div key={entry.id} className="flex flex-col gap-1 border-b px-4 py-2 sm:flex-row sm:justify-between">
            <span className="min-w-0">
              {entry.product.name}: {entry.previousQuantity} → {entry.newQuantity} ({entry.reason})
            </span>
            <span className="shrink-0 text-slate-500">{new Date(entry.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminReportsPage() {
  const [preset, setPreset] = useState("month");
  const report = useQuery({
    queryKey: ["reports", preset],
    queryFn: async () =>
      (
        await api.get<{
          success: true;
          data: {
            empty: boolean;
            totalOrders: number;
            totalRevenue: string;
            deliveredOrders: number;
            cancelledOrders: number;
            averageOrderValue: string;
            salesOverTime: { date: string; orders: number; revenue: number }[];
            revenueByCategory: { category: string; amount: number }[];
            bestSelling: { name: string; quantity: number; revenue: number }[];
          };
        }>(`/api/reports/sales?preset=${preset}`)
      ).data,
  });
  const data = report.data;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Sales reports</h1>
        <select value={preset} onChange={(e) => setPreset(e.target.value)} className="rounded-lg border px-3 py-2">
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="year">This year</option>
        </select>
      </div>
      {data?.empty ? <p className="mt-4 text-slate-500">No sales data yet.</p> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          ["Orders", data?.totalOrders ?? 0],
          ["Revenue", data ? formatMoney(data.totalRevenue) : "—"],
          ["Delivered", data?.deliveredOrders ?? 0],
          ["Avg order", data ? formatMoney(data.averageOrderValue) : "—"],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 h-64 min-w-0 overflow-hidden rounded-xl border bg-white p-3 md:h-72 md:p-4">
        <ResponsiveContainer>
          <LineChart data={data?.salesOverTime ?? []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#0f172a" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 h-64 min-w-0 overflow-hidden rounded-xl border bg-white p-3 md:h-72 md:p-4">
        <ResponsiveContainer>
          <BarChart data={data?.revenueByCategory ?? []}>
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="#b08d57" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <a className="rounded-lg border px-4 py-2 text-sm" href={`${import.meta.env.VITE_API_URL ?? ""}/api/reports/export/orders.csv?preset=${preset}`}>
          Export orders CSV
        </a>
        <a className="rounded-lg border px-4 py-2 text-sm" href={`${import.meta.env.VITE_API_URL ?? ""}/api/reports/export/sales.csv?preset=${preset}`}>
          Export sales CSV
        </a>
      </div>
      <h2 className="mt-8 font-medium">Best selling</h2>
      <div className="mt-3 rounded-xl border bg-white">
        {data?.bestSelling.map((item) => (
          <div key={item.name} className="flex justify-between border-b px-4 py-2 text-sm">
            <span>{item.name}</span>
            <span>
              {item.quantity} · {formatMoney(item.revenue)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminNewsletterPage() {
  const client = useQueryClient();
  const list = useQuery({
    queryKey: ["newsletter"],
    queryFn: async () =>
      (await api.get<{ success: true; data: { id: string; email: string; createdAt: string }[] }>("/api/newsletter")).data,
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Newsletter</h1>
      <div className="mt-6 rounded-xl border bg-white">
        {list.data?.map((item) => (
          <div key={item.id} className="flex items-center justify-between border-b px-4 py-3 text-sm">
            <span>{item.email}</span>
            <button
              className="text-red-600"
              onClick={async () => {
                await api.delete(`/api/newsletter/${item.id}`);
                client.invalidateQueries({ queryKey: ["newsletter"] });
              }}
            >
              Remove
            </button>
          </div>
        ))}
        {!list.data?.length ? <p className="p-6 text-slate-500">No subscribers yet.</p> : null}
      </div>
    </div>
  );
}

export function AdminSettingsPage() {
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await api.get<{ success: true; data: Record<string, string | boolean | null> }>("/api/settings")).data,
  });
  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!data) return;
    setForm({
      storeName: String(data.storeName ?? ""),
      storeEmail: String(data.storeEmail ?? ""),
      storePhone: String(data.storePhone ?? ""),
      storeAddress: String(data.storeAddress ?? ""),
      instagramUrl: String(data.instagramUrl ?? ""),
      facebookUrl: String(data.facebookUrl ?? ""),
      deliveryFee: String(data.deliveryFee ?? "0"),
      freeDeliveryThreshold: String(data.freeDeliveryThreshold ?? ""),
      announcementBarText: String(data.announcementBarText ?? ""),
      footerText: String(data.footerText ?? ""),
      contactInformation: String(data.contactInformation ?? ""),
      orderConfirmationMessage: String(data.orderConfirmationMessage ?? ""),
      deliveryInformation: String(data.deliveryInformation ?? ""),
      heroHeadline: String(data.heroHeadline ?? ""),
      heroSubheadline: String(data.heroSubheadline ?? ""),
      promoBannerTitle: String(data.promoBannerTitle ?? ""),
      promoBannerText: String(data.promoBannerText ?? ""),
      promoBannerCta: String(data.promoBannerCta ?? ""),
    });
  }, [data]);

  if (!data) return <p>Loading…</p>;

  const fields = Object.keys(form);
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Website settings</h1>
      <form
        className="mt-6 space-y-3 rounded-xl border bg-white p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          await api.put("/api/settings", {
            ...form,
            deliveryFee: Number(form.deliveryFee),
            freeDeliveryThreshold: form.freeDeliveryThreshold ? Number(form.freeDeliveryThreshold) : null,
            announcementBarEnabled: true,
          });
          toast.success("Settings saved");
        }}
      >
        {fields.map((key) => (
          <label key={key} className="block text-sm capitalize">
            {key.replace(/([A-Z])/g, " $1")}
            <input
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
        ))}
        <label className="block text-sm">
          Logo
          <input
            type="file"
            className="mt-1"
            onChange={async (e) => {
              const files = e.target.files;
              if (!files?.[0]) return;
              const body = new FormData();
              body.append("files", files[0]);
              const res = await api.post<{ success: true; data: { url: string }[] }>("/api/uploads", body);
              await api.put("/api/settings", { storeLogo: res.data[0].url });
              toast.success("Logo uploaded");
            }}
          />
        </label>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-white">Save settings</button>
      </form>
    </div>
  );
}

export function AdminUsersPage() {
  const client = useQueryClient();
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () =>
      (await api.get<{ success: true; data: { id: string; email: string; name: string; role: string; isActive: boolean }[] }>("/api/admin-users")).data,
  });
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ADMIN" });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Admin users</h1>
      <form
        className="mt-4 grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          await api.post("/api/admin-users", form);
          toast.success("Admin created");
          client.invalidateQueries({ queryKey: ["admin-users"] });
        }}
      >
        <input className="rounded border px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="rounded border px-3 py-2" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="rounded-lg bg-slate-900 text-white">Add admin</button>
      </form>
      <div className="mt-6 rounded-xl border bg-white">
        {users.data?.map((user) => (
          <div key={user.id} className="flex justify-between border-b px-4 py-3 text-sm">
            <span>
              {user.name} · {user.email}
            </span>
            <span>{user.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminProfilePage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const me = useQuery({
    queryKey: ["admin-me"],
    queryFn: async () => (await api.get<{ success: true; data: { name: string; email: string } }>("/api/auth/me")).data,
  });
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <form
        className="mt-6 space-y-3 rounded-xl border bg-white p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          await api.patch("/api/auth/profile", { name: name || me.data?.name, password: password || undefined });
          toast.success("Profile updated");
        }}
      >
        <p className="text-sm text-slate-500">{me.data?.email}</p>
        <input className="w-full rounded-lg border px-3 py-2" placeholder={me.data?.name} value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full rounded-lg border px-3 py-2" type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-white">Save</button>
      </form>
    </div>
  );
}
