import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api, ApiError } from "../../lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function AdminLoginPage() {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <form
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await api.post("/api/auth/login", values);
            toast.success("Welcome back");
            navigate("/admin");
          } catch (error) {
            toast.error(error instanceof ApiError ? error.message : "Login failed");
          }
        })}
      >
        <p className="text-xs uppercase tracking-[0.25em] text-amber-500">IVA Accessories</p>
        <h1 className="mt-3 text-2xl font-semibold">Studio login</h1>
        <input
          {...form.register("email")}
          placeholder="Email"
          className="mt-8 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3"
        />
        <input
          {...form.register("password")}
          type="password"
          placeholder="Password"
          className="mt-3 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-3"
        />
        <button className="mt-6 w-full rounded-lg bg-white py-3 text-sm font-medium text-slate-950">
          Sign in
        </button>
      </form>
    </div>
  );
}
