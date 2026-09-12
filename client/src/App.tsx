import { Navigate, Route, Routes } from "react-router-dom";
import { StoreLayout } from "./layouts/StoreLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { HomePage } from "./pages/store/HomePage";
import { ShopPage } from "./pages/store/ShopPage";
import { ProductPage } from "./pages/store/ProductPage";
import { CartPage } from "./pages/store/CartPage";
import { CheckoutPage } from "./pages/store/CheckoutPage";
import { OrderConfirmationPage } from "./pages/store/OrderConfirmationPage";
import { TrackOrderPage } from "./pages/store/TrackOrderPage";
import {
  AboutPage,
  ContactPage,
  PrivacyPage,
  ReturnsPage,
  TermsPage,
} from "./pages/store/ContentPages";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminOverviewPage } from "./pages/admin/AdminOverviewPage";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminProductFormPage } from "./pages/admin/AdminProductFormPage";
import { AdminOrderDetailPage, AdminOrdersPage } from "./pages/admin/AdminOrdersPage";
import {
  AdminCategoriesPage,
  AdminCustomerDetailPage,
  AdminCustomersPage,
  AdminInventoryPage,
  AdminNewsletterPage,
  AdminProfilePage,
  AdminReportsPage,
  AdminSettingsPage,
  AdminUsersPage,
} from "./pages/admin/AdminMiscPages";

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:category" element={<ShopPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
      </Route>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverviewPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/new" element={<AdminProductFormPage />} />
        <Route path="products/:id" element={<AdminProductFormPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="newsletter" element={<AdminNewsletterPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
