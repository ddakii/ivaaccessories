import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/apiResponse.js";
import { calculateDeliveryFee, money, moneyString } from "../lib/money.js";
import { recordInventoryChange } from "./inventoryService.js";
import {
  sendNewOrderToStore,
  sendOrderConfirmationToCustomer,
  sendOrderStatusEmail,
} from "../lib/email.js";

type CheckoutItem = {
  productId: string;
  quantity: number;
  color?: string;
  size?: string;
};

export async function placeOrder(input: {
  fullName: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  addressDetails?: string;
  notes?: string;
  items: CheckoutItem[];
}) {
  const settings = await prisma.websiteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const productIds = input.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  if (products.length !== new Set(productIds).size) {
    throw new HttpError(400, "Një ose më shumë produkte nuk janë të disponueshme");
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  let subtotal = money(0);

  const resolvedItems = input.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new HttpError(400, "Produkti nuk u gjet");
    if (product.stock < item.quantity) {
      throw new HttpError(400, `Nuk ka stok të mjaftueshëm për ${product.name}`);
    }
    const unit = product.salePrice ?? product.price;
    subtotal = subtotal.plus(money(unit).times(item.quantity));
    return {
      product,
      quantity: item.quantity,
      color: item.color,
      size: item.size,
      unitPrice: money(unit),
    };
  });

  const deliveryFee = calculateDeliveryFee(
    subtotal,
    settings.deliveryFee,
    settings.freeDeliveryThreshold
  );
  const total = subtotal.plus(deliveryFee);
  const email = input.email?.trim() ? input.email.trim() : null;

  const order = await prisma.$transaction(async (tx) => {
    const counter = await tx.orderCounter.upsert({
      where: { id: "default" },
      update: { current: { increment: 1 } },
      create: { id: "default", current: 1001 },
    });
    const orderNumber = `IVA-${counter.current}`;

    const customer = await tx.customer.upsert({
      where: { phone: input.phone.replace(/\s+/g, "") },
      update: {
        fullName: input.fullName,
        email,
        city: input.city,
        address: input.address,
      },
      create: {
        fullName: input.fullName,
        phone: input.phone.replace(/\s+/g, ""),
        email,
        city: input.city,
        address: input.address,
      },
    });

    const created = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        fullName: input.fullName,
        phone: input.phone.replace(/\s+/g, ""),
        email,
        city: input.city,
        address: input.address,
        addressDetails: input.addressDetails || null,
        notes: input.notes || null,
        paymentMethod: "COD",
        status: "PENDING",
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total.toFixed(2),
        items: {
          create: resolvedItems.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            sku: item.product.sku,
            imageUrl: item.product.images[0]?.url ?? null,
            unitPrice: item.unitPrice.toFixed(2),
            quantity: item.quantity,
            color: item.color || null,
            size: item.size || null,
          })),
        },
        statusHistory: {
          create: { status: "PENDING", note: "Order placed" },
        },
      },
      include: { items: true },
    });

    for (const item of resolvedItems) {
      const updated = await tx.product.update({
        where: { id: item.product.id },
        data: {
          stock: { decrement: item.quantity },
          salesCount: { increment: item.quantity },
        },
      });
      if (updated.stock < 0) {
        throw new HttpError(400, `Nuk ka stok të mjaftueshëm për ${item.product.name}`);
      }
      await tx.inventoryMovement.create({
        data: {
          productId: item.product.id,
          previousQuantity: item.product.stock,
          newQuantity: updated.stock,
          change: -item.quantity,
          reason: `Order ${orderNumber}`,
        },
      });
    }

    return created;
  });

  const emailItems = order.items.map((item) => ({
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: moneyString(item.unitPrice),
  }));

  await sendNewOrderToStore({
    orderNumber: order.orderNumber,
    fullName: order.fullName,
    phone: order.phone,
    email: order.email,
    city: order.city,
    address: order.address,
    total: moneyString(order.total),
    items: emailItems,
  });

  if (order.email) {
    await sendOrderConfirmationToCustomer({
      to: order.email,
      orderNumber: order.orderNumber,
      fullName: order.fullName,
      total: moneyString(order.total),
      message: settings.orderConfirmationMessage,
      items: emailItems,
    });
  }

  return order;
}

export async function updateOrderStatus(
  orderId: string,
  status: Prisma.OrderUpdateInput["status"],
  note?: string,
  internalNotes?: string
) {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!existing) throw new HttpError(404, "Order not found");
  if (existing.status === status) return existing;
  if (existing.status === "CANCELLED") {
    throw new HttpError(400, "Cancelled orders cannot be updated");
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (status === "CANCELLED" && existing.status !== "CANCELLED") {
      for (const item of existing.items) {
        const product = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            salesCount: { decrement: item.quantity },
          },
        });
        await recordInventoryChange({
          productId: item.productId,
          previousQuantity: product.stock - item.quantity,
          newQuantity: product.stock,
          reason: `Order ${existing.orderNumber} cancelled`,
        });
      }
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: status as never,
        internalNotes: internalNotes ?? existing.internalNotes,
        deliveredAt: status === "DELIVERED" ? new Date() : existing.deliveredAt,
        statusHistory: {
          create: { status: status as never, note: note || null },
        },
      },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        customer: true,
      },
    });
  });

  if (updated.email) {
    await sendOrderStatusEmail({
      to: updated.email,
      orderNumber: updated.orderNumber,
      fullName: updated.fullName,
      status: String(updated.status),
    });
  }

  return updated;
}
