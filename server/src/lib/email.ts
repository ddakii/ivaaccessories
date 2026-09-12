import nodemailer from "nodemailer";
import { Resend } from "resend";
import { emailConfigured, env } from "./env.js";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

let warned = false;

function layout(title: string, body: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f8f8f6;font-family:Georgia,serif;color:#171717;">
    <div style="max-width:560px;margin:32px auto;background:#ffffff;border:1px solid #e5e5e5;padding:32px;">
      <p style="letter-spacing:0.28em;font-size:11px;color:#b08d57;text-transform:uppercase;margin:0 0 16px;">IVA Accessories</p>
      <h1 style="font-weight:500;font-size:22px;margin:0 0 16px;">${title}</h1>
      <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#333;">${body}</div>
    </div>
  </body>
</html>`;
}

async function send(payload: EmailPayload) {
  if (!emailConfigured()) {
    if (!warned) {
      console.warn(
        "[email] Email is not configured. Orders still save. Set EMAIL_PROVIDER and credentials in .env to enable notifications."
      );
      warned = true;
    }
    return { sent: false as const, reason: "not_configured" };
  }

  try {
    if (env.email.provider === "resend") {
      const resend = new Resend(env.email.apiKey);
      await resend.emails.send({
        from: env.email.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      return { sent: true as const };
    }

    const transporter = nodemailer.createTransport({
      host: env.email.smtpHost,
      port: env.email.smtpPort,
      secure: env.email.smtpPort === 465,
      auth: { user: env.email.smtpUser, pass: env.email.smtpPassword },
    });
    await transporter.sendMail({
      from: env.email.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    return { sent: true as const };
  } catch (error) {
    console.error("[email] Failed to send message:", error);
    return { sent: false as const, reason: "send_failed" };
  }
}

function itemsTable(items: { productName: string; quantity: number; unitPrice: string }[]) {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;">${item.productName}</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${item.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #eee;">€${item.unitPrice}</td></tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}</table>`;
}

export async function sendNewOrderToStore(input: {
  orderNumber: string;
  fullName: string;
  phone: string;
  email?: string | null;
  city: string;
  address: string;
  total: string;
  items: { productName: string; quantity: number; unitPrice: string }[];
}) {
  const to = env.email.storeEmail;
  if (!to) return { sent: false as const, reason: "no_store_email" };
  const body = `
    <p>A new Cash on Delivery order has been placed.</p>
    <p><strong>Order:</strong> ${input.orderNumber}<br/>
    <strong>Customer:</strong> ${input.fullName}<br/>
    <strong>Phone:</strong> ${input.phone}<br/>
    ${input.email ? `<strong>Email:</strong> ${input.email}<br/>` : ""}
    <strong>Address:</strong> ${input.address}, ${input.city}<br/>
    <strong>Payment:</strong> Cash on Delivery<br/>
    <strong>Total:</strong> €${input.total}</p>
    ${itemsTable(input.items)}
  `;
  return send({
    to,
    subject: `New Order #${input.orderNumber}`,
    html: layout(`New order ${input.orderNumber}`, body),
  });
}

export async function sendOrderConfirmationToCustomer(input: {
  to: string;
  orderNumber: string;
  fullName: string;
  total: string;
  message: string;
  items: { productName: string; quantity: number; unitPrice: string }[];
}) {
  const body = `
    <p>Dear ${input.fullName},</p>
    <p>${input.message}</p>
    <p><strong>Order number:</strong> ${input.orderNumber}<br/>
    <strong>Payment:</strong> Cash on Delivery — pay when your order is delivered.<br/>
    <strong>Total:</strong> €${input.total}</p>
    ${itemsTable(input.items)}
  `;
  return send({
    to: input.to,
    subject: `Your IVA Accessories order ${input.orderNumber}`,
    html: layout("Order received", body),
  });
}

export async function sendOrderStatusEmail(input: {
  to: string;
  orderNumber: string;
  fullName: string;
  status: string;
}) {
  const body = `
    <p>Dear ${input.fullName},</p>
    <p>The status of order <strong>${input.orderNumber}</strong> is now <strong>${input.status}</strong>.</p>
    <p>If you have questions, reply to this email or contact us through the website.</p>
  `;
  return send({
    to: input.to,
    subject: `Order ${input.orderNumber} update: ${input.status}`,
    html: layout("Order update", body),
  });
}

export async function sendContactMessage(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  const to = env.email.storeEmail;
  if (!to) return { sent: false as const, reason: "no_store_email" };
  const body = `<p><strong>Name:</strong> ${input.name}<br/><strong>Email:</strong> ${input.email}<br/>${input.phone ? `<strong>Phone:</strong> ${input.phone}<br/>` : ""}</p><p>${input.message}</p>`;
  return send({
    to,
    subject: `Website enquiry from ${input.name}`,
    html: layout("New enquiry", body),
  });
}
