import { defineConfig, env } from "prisma/config";

const placeholderDatabaseUrl =
  "postgresql://afterservice:afterservice@localhost:5432/afterservice";

function isCodegenCommand() {
  return process.argv.some((arg) => arg === "generate" || arg === "validate");
}

function databaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (isCodegenCommand()) {
    return placeholderDatabaseUrl;
  }

  return env("DATABASE_URL");
}

export default defineConfig({
  datasource: {
    url: databaseUrl(),
  },
  migrations: {
    path: "prisma/migrations",
  },
  schema: "prisma/schema.prisma",
});
