export type Gender = "WOMEN" | "MEN" | "UNISEX";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";
export type AdminRole = "SUPER_ADMIN" | "ADMIN";

export type WhyShopBenefit = {
  title: string;
  description: string;
};

export type ProductImageDto = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type ProductDto = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  price: string;
  salePrice: string | null;
  categoryId: string;
  category: CategoryDto;
  gender: Gender;
  stock: number;
  colors: string[];
  sizes: string[];
  isFeatured: boolean;
  isActive: boolean;
  isNewArrival: boolean;
  salesCount: number;
  images: ProductImageDto[];
  createdAt: string;
};

export type CartItemPayload = {
  productId: string;
  quantity: number;
  color?: string;
  size?: string;
};

export type WebsiteSettingsDto = {
  id: string;
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
  whyShopBenefits: WhyShopBenefit[];
};
