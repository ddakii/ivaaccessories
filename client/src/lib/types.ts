export type Gender = "WOMEN" | "MEN" | "UNISEX";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type ProductImage = { id?: string; url: string; alt?: string | null; sortOrder?: number };

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  price: string;
  salePrice: string | null;
  categoryId: string;
  category: Category;
  gender: Gender;
  stock: number;
  colors: string[];
  sizes: string[];
  isFeatured: boolean;
  isActive: boolean;
  isNewArrival: boolean;
  salesCount: number;
  images: ProductImage[];
  createdAt: string;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: string;
  quantity: number;
  color?: string;
  size?: string;
  stock: number;
};

export type Settings = {
  storeName: string;
  storeLogo: string | null;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  deliveryFee: string;
  freeDeliveryThreshold: string | null;
  announcementBarText: string;
  announcementBarEnabled: boolean;
  footerText: string;
  contactInformation: string;
  orderConfirmationMessage: string;
  deliveryInformation: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string | null;
  promoBannerTitle: string;
  promoBannerText: string;
  promoBannerCta: string;
  promoBannerImage: string | null;
  whyShopBenefits: { title: string; description: string }[];
};

export type Order = {
  id: string;
  orderNumber: string;
  fullName: string;
  phone: string;
  email?: string | null;
  city: string;
  address: string;
  addressDetails?: string | null;
  notes?: string | null;
  paymentMethod: string;
  status: OrderStatus;
  subtotal: string;
  deliveryFee: string;
  total: string;
  createdAt: string;
  deliveredAt?: string | null;
  confirmationMessage?: string;
  deliveryInformation?: string;
  items: {
    id: string;
    productName: string;
    sku: string;
    imageUrl?: string | null;
    unitPrice: string;
    quantity: number;
    color?: string | null;
  }[];
  statusHistory?: { id: string; status: OrderStatus; note?: string | null; createdAt: string }[];
};
