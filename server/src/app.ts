import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "./lib/env.js";
import { publicLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { authRouter } from "./routes/auth.js";
import { productsRouter } from "./routes/products.js";
import { categoriesRouter } from "./routes/categories.js";
import { ordersRouter } from "./routes/orders.js";
import { customersRouter } from "./routes/customers.js";
import { inventoryRouter } from "./routes/inventory.js";
import { reportsRouter } from "./routes/reports.js";
import { settingsRouter } from "./routes/settings.js";
import { newsletterRouter } from "./routes/newsletter.js";
import { adminUsersRouter } from "./routes/adminUsers.js";
import { uploadRouter } from "./routes/upload.js";
import { overviewRouter } from "./routes/overview.js";
import { contactRouter } from "./routes/contact.js";
import { uploadsDir } from "./lib/storage.js";

const here = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
      },
    },
  })
);
app.use(
  cors({
    origin: env.clientUrl.split(",").map((value) => value.trim()),
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(publicLimiter);
app.use(
  "/uploads",
  express.static(uploadsDir, {
    maxAge: "7d",
    immutable: true,
    etag: true,
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { ok: true, store: "IVA Accessories" } });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/customers", customersRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/admin-users", adminUsersRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/overview", overviewRouter);
app.use("/api/contact", contactRouter);

if (env.isProd) {
  const clientDist = path.resolve(here, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(path.join(clientDist, "index.html"), (error) => {
      if (error) next(error);
    });
  });
}

app.use(notFound);
app.use(errorHandler);

void here;
