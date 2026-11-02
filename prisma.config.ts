import { defineConfig } from "prisma/config";

// Next.js loads .env.local automatically at runtime, but the Prisma CLI does not.
try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
    throw error;
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
