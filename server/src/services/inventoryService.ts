import { prisma } from "../lib/prisma.js";

export async function recordInventoryChange(input: {
  productId: string;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  adminUserId?: string | null;
}) {
  const change = input.newQuantity - input.previousQuantity;
  await prisma.inventoryMovement.create({
    data: {
      productId: input.productId,
      previousQuantity: input.previousQuantity,
      newQuantity: input.newQuantity,
      change,
      reason: input.reason,
      adminUserId: input.adminUserId ?? null,
    },
  });
}

export async function setStock(productId: string, quantity: number, reason: string, adminUserId?: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");
  await prisma.product.update({ where: { id: productId }, data: { stock: quantity } });
  await recordInventoryChange({
    productId,
    previousQuantity: product.stock,
    newQuantity: quantity,
    reason,
    adminUserId,
  });
}
