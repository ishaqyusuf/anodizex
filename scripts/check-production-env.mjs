#!/usr/bin/env node

import { resolve } from "node:path";
import {
  parseEnvFile,
  redactedUrl,
  validateProductionEnv,
} from "./production-env-guard.mjs";

const envPath = resolve(process.cwd(), ".env.production");
const fileEnv = parseEnvFile(envPath);
const env = {
  ...fileEnv,
  ...process.env,
  DATABASE_URL: fileEnv.DATABASE_URL ?? process.env.DATABASE_URL,
};
const issues = validateProductionEnv(env);

if (issues.length > 0) {
  console.error("Production environment check failed:");

  for (const issue of issues) {
    console.error(`- ${issue}`);
  }

  process.exit(1);
}

console.log("Production environment check passed.");
console.log(`DATABASE_URL=${redactedUrl(env.DATABASE_URL)}`);
