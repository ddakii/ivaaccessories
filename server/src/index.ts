import { env } from "./lib/env.js";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

async function main() {
  app.listen(env.port, () => {
    console.log(`IVA Accessories API running on ${env.serverUrl}`);
  });
  try {
    await prisma.$connect();
  } catch (error) {
    console.warn("Database is unavailable. Product photos still serve from /uploads.", error);
  }
}

main().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
