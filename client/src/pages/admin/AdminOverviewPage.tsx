import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { formatMoney } from "../../lib/utils";

type Overview = {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  totalRevenue: string;
  totalProducts: number;
  lowStock: number;
  empty: boolean;
  recentOrders: { id: string; orderNumber: string; fullName: string; total: string; status: string; createdAt: string }[];
};

export function AdminOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: async () => (await api.get<{ success: true; data: Overview }>("/api/overview")).data,
  });

  if (isLoading) return <p>Loading…</p>;
  if (!data) return null;

  const cards = [
    ["Total orders", data.totalOrders],
    ["Pending", data.pendingOrders],
    ["Confirmed", data.confirmedOrders],
    ["Delivered", data.deliveredOrders],
    ["Revenue", formatMoney(data.totalRevenue)],
    ["Products", data.totalProducts],
    ["Low stock", data.lowStock],
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Overview</h1>
      {data.empty ? <p className="mt-2 text-slate-500">No sales data yet.</p> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4 font-medium">Recent orders</div>
        <table className="stack-table w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="px-5 py-3">Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.recentOrders.map((order) => (
              <tr key={order.id} className="border-t border-slate-100">
                <td className="px-5 py-3" data-label="Order">
                  <Link className="text-indigo-600" to={`/admin/orders/${order.id}`}>
                    {order.orderNumber}
                  </Link>
                </td>
                <td data-label="Customer">{order.fullName}</td>
                <td data-label="Status">{order.status}</td>
                <td data-label="Total">{formatMoney(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
