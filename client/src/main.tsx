import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import App from "./App";
import { CartProvider } from "./lib/cart";
import { ScrollToTop } from "./components/ScrollToTop";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CartProvider>
            <ScrollToTop />
            <App />
            <Toaster position="top-center" richColors />
          </CartProvider>
        </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
