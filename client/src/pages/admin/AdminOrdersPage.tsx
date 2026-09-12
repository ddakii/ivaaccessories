import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../../lib/api";
import type { Order, OrderStatus } from "../../lib/types";
import { formatMoney } from "../../lib/utils";

export function AdminOrdersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const orders = useQuery({
    queryKey: ["admin-orders", q, status],
    queryFn: async () =>
      (
        await api.get<{ success: true; data: Order[] }>(
          `/api/orders?q=${encodeURIComponent(q)}&status=${status}`
        )
      ).data,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>
      <div className="mt-4 flex flex-wrap gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search number, name, phone" className="w-full rounded-lg border px-3 py-2 sm:w-auto" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border px-3 py-2 sm:w-auto">
          <option value="">All statuses</option>
          {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="mt-6 rounded-xl border bg-white">
        <table className="stack-table w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.data?.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="px-4 py-3" data-label="Order">
                  <Link className="text-indigo-600" to={`/admin/orders/${order.id}`}>
                    {order.orderNumber}
                  </Link>
                </td>
                <td data-label="Customer">{order.fullName}</td>
                <td data-label="Phone">{order.phone}</td>
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

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const client = useQueryClient();
  const order = useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => (await api.get<{ success: true; data: Order }>(`/api/orders/${id}`)).data,
  });
  const update = useMutation({
    mutationFn: (status: OrderStatus) => api.patch(`/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      toast.success("Status updated");
      client.invalidateQueries({ queryKey: ["admin-order", id] });
    },
  });

  if (!order.data) return <p>Loading…</p>;
  const item = order.data;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-xl border bg-white p-6">
        <h1 className="text-2xl font-semibold">{item.orderNumber}</h1>
        <p className="text-sm text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
        <div className="mt-6 space-y-2 text-sm">
          {item.items.map((line) => (
            <div key={line.id} className="flex justify-between border-b py-2">
              <span>
                {line.productName} × {line.quantity} {line.color ? `(${line.color})` : ""}
              </span>
              <span>{formatMoney(Number(line.unitPrice) * line.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2">Subtotal {formatMoney(item.subtotal)}</div>
          <div className="flex justify-between">Delivery {formatMoney(item.deliveryFee)}</div>
          <div className="flex justify-between font-medium">Total {formatMoney(item.total)}</div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border bg-white p-5 text-sm">
          <p className="font-medium">Customer</p>
          <p className="mt-2">{item.fullName}</p>
          <p>{item.phone}</p>
          <p>{item.email}</p>
          <p className="mt-2">
            {item.address}, {item.city}
          </p>
          {item.notes ? <p className="mt-2 text-slate-500">{item.notes}</p> : null}
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="font-medium">Status</p>
          <select
            className="mt-3 w-full rounded-lg border px-3 py-2"
            value={item.status}
            onChange={(e) => update.mutate(e.target.value as OrderStatus)}
          >
            {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <div className="mt-4 space-y-2 text-xs text-slate-500">
            {item.statusHistory?.map((entry) => (
              <p key={entry.id}>
                {entry.status} · {new Date(entry.createdAt).toLocaleString()}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
