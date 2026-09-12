import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { ReactNode } from "react";
import { Seo } from "../../components/Seo";
import { useSettings } from "../../lib/hooks";
import { api } from "../../lib/api";
import { sq } from "../../lib/i18n";

export function AboutPage() {
  const { data: settings } = useSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-16">
      <Seo title={sq.about.title} />
      <p className="text-[11px] uppercase tracking-brand text-gold">{sq.about.kicker}</p>
      <h1 className="nav-type-lg mt-3">{sq.about.title}</h1>
      <div className="mt-8 space-y-5 text-sm leading-7 text-muted">
        <p>{sq.about.p1}</p>
        <p>{sq.about.p2}</p>
        <p>{settings?.contactInformation || sq.about.fallbackContact}</p>
      </div>
    </div>
  );
}

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(10),
});

export function ContactPage() {
  const { data: settings } = useSettings();
  const form = useForm<z.infer<typeof contactSchema>>({ resolver: zodResolver(contactSchema) });

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 md:grid-cols-2 md:gap-12 md:px-8 md:py-16">
      <Seo title={sq.contact.title} />
      <div>
        <p className="text-[11px] uppercase tracking-brand text-gold">{sq.contact.kicker}</p>
        <h1 className="nav-type-lg mt-3">{sq.contact.title}</h1>
        <div className="mt-6 space-y-2 text-sm text-muted">
          {settings?.storeEmail ? <p>{settings.storeEmail}</p> : null}
          {settings?.storePhone ? <p>{settings.storePhone}</p> : null}
          {settings?.storeAddress ? <p>{settings.storeAddress}</p> : null}
          <p className="pt-4">{settings?.contactInformation}</p>
        </div>
      </div>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await api.post("/api/contact", values);
            toast.success(sq.contact.sent);
            form.reset();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : sq.contact.failed);
          }
        })}
      >
        <input {...form.register("name")} placeholder={sq.contact.name} className="w-full border border-line px-3 py-3" />
        <input {...form.register("email")} placeholder={sq.contact.email} className="w-full border border-line px-3 py-3" />
        <input {...form.register("phone")} placeholder={sq.contact.phone} className="w-full border border-line px-3 py-3" />
        <textarea
          {...form.register("message")}
          placeholder={sq.contact.message}
          rows={6}
          className="w-full border border-line px-3 py-3"
        />
        <button className="bg-ink px-6 py-3 text-[11px] uppercase tracking-brand text-white">{sq.contact.send}</button>
      </form>
    </div>
  );
}

function Legal({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-16">
      <Seo title={title} />
      <h1 className="nav-type-lg">{title}</h1>
      <div className="mt-8 space-y-4 text-sm leading-7 text-muted">{children}</div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <Legal title={sq.privacy.title}>
      <p>{sq.privacy.p1}</p>
      <p>{sq.privacy.p2}</p>
    </Legal>
  );
}

export function TermsPage() {
  return (
    <Legal title={sq.terms.title}>
      <p>{sq.terms.p1}</p>
      <p>{sq.terms.p2}</p>
    </Legal>
  );
}

export function ReturnsPage() {
  return (
    <Legal title={sq.returns.title}>
      <p>{sq.returns.p1}</p>
      <p>{sq.returns.p2}</p>
    </Legal>
  );
}
