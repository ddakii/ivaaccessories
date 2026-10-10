import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { tryOfflineApi } from "./dev-offline-api";

const uploadsRoot = path.resolve(__dirname, "../server/uploads");

const mime: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

function localUploads(): Plugin {
  return {
    name: "local-uploads",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/uploads/")) return next();
        const rel = decodeURIComponent(req.url.replace(/^\/uploads\/?/, "").split("?")[0]);
        const file = path.normalize(path.join(uploadsRoot, rel));
        if (!file.startsWith(uploadsRoot) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
          return next();
        }
        res.setHeader("Content-Type", mime[path.extname(file).toLowerCase()] ?? "application/octet-stream");
        res.setHeader("Cache-Control", "public, max-age=86400");
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localUploads()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        selfHandleResponse: true,
        configure(proxy) {
          proxy.on("error", (_error, req, res) => {
            if ("writeHead" in res && tryOfflineApi(req, res)) return;
            if ("writeHead" in res && !res.headersSent) {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: "API is not running" }));
            }
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            if ((proxyRes.statusCode ?? 500) >= 500 && "writeHead" in res && tryOfflineApi(req, res)) {
              proxyRes.resume();
              return;
            }
            res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
            proxyRes.pipe(res);
          });
        },
      },
    },
  },
});
