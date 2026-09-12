import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Box,
  Folders,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";

const LINKS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Folders },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { to: "/admin/reports", label: "Sales reports", icon: BarChart3 },
  { to: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { to: "/admin/settings", label: "Website settings", icon: Settings },
  { to: "/admin/users", label: "Admin users", icon: Box },
  { to: "/admin/profile", label: "Profile", icon: Users },
];

function AdminNav({ onClick }: { onClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={onClick}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"}`
          }
        >
          <link.icon size={16} />
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const me = useQuery({
    queryKey: ["admin-me"],
    queryFn: async () => (await api.get<{ success: true; data: { name: string; email: string } }>("/api/auth/me")).data,
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (me.isError) navigate("/admin/login");
  }, [me.isError, navigate]);

  if (me.isLoading) return <div className="p-10 text-sm text-slate-500">Loading studio…</div>;
  if (me.isError) return null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-slate-950 text-white lg:block">
        <div className="px-6 py-6">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-500">Studio</p>
          <p className="mt-1 text-lg font-semibold">IVA Admin</p>
        </div>
        <AdminNav />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="relative h-full w-72 overflow-y-auto bg-slate-950 text-white">
            <div className="flex items-center justify-between px-6 py-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-500">Studio</p>
                <p className="mt-1 text-lg font-semibold">IVA Admin</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <AdminNav onClick={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
                <Menu size={20} />
              </button>
              <p className="truncate text-sm text-slate-500">{me.data?.email}</p>
            </div>
            <button
              className="flex shrink-0 items-center gap-2 text-sm text-slate-600"
              onClick={async () => {
                await api.post("/api/auth/logout");
                toast.success("Signed out");
                navigate("/admin/login");
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
          <nav className="no-scrollbar flex gap-4 overflow-x-auto border-t border-slate-100 px-4 py-2 text-xs lg:hidden">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `shrink-0 whitespace-nowrap rounded-full px-3 py-1 ${isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
