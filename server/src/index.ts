import { env } from "./lib/env.js";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

async function main() {
  await prisma.$connect();
  app.listen(env.port, () => {
    console.log(`IVA Accessories API running on ${env.serverUrl}`);
  });
}

main().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
