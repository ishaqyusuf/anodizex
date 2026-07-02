#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDir, "..");
const envPath = resolve(workspaceRoot, ".env.production");
const environment = "production";
const systemKeyPrefixes = ["VERCEL", "VERCEL_", "TURBO_"];
const systemKeys = new Set(["NX_DAEMON"]);

function printHelp() {
  console.log("afterservice production env helper");
  console.log("");
  console.log("Usage:");
  console.log("  bun run env:prod:import");
  console.log("  bun run env:prod:export");
  console.log("  bun run env:prod:export:apply");
  console.log("");
  console.log("Commands:");
  console.log(
    "  import, pull       Pull Vercel production envs to .env.production",
  );
  console.log(
    "  export, push       Dry-run upload of .env.production to Vercel",
  );
  console.log(
    "  export --apply     Upload .env.production to Vercel production",
  );
}

function parseArgs(argv) {
  const [command = "help", ...rest] = argv;
  const flags = new Set(rest);

  return {
    apply: flags.has("--apply"),
    command,
    includeSystem: flags.has("--include-system"),
  };
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing ${filePath}. Run bun run env:prod:import first.`);
  }

  const entries = [];

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(
      /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/,
    );

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    let value = rawValue.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries.push({ key, value });
  }

  return entries;
}

function isSystemKey(key) {
  return (
    systemKeys.has(key) ||
    systemKeyPrefixes.some((prefix) => key === prefix || key.startsWith(prefix))
  );
}

function run(command, args, options = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd: workspaceRoot,
      shell: process.platform === "win32",
      stdio:
        options.input === undefined
          ? "inherit"
          : ["pipe", "inherit", "inherit"],
    });

    if (options.input !== undefined) {
      child.stdin.end(options.input);
    }

    child.on("error", rejectRun);
    child.on("exit", (code, signal) => {
      if (signal) {
        rejectRun(new Error(`${command} stopped by signal ${signal}.`));
        return;
      }

      if (code !== 0) {
        rejectRun(new Error(`${command} exited with code ${code}.`));
        return;
      }

      resolveRun();
    });
  });
}

async function importProductionEnv() {
  await run("vercel", [
    "env",
    "pull",
    ".env.production",
    "--environment=production",
    "--yes",
  ]);
}

async function exportProductionEnv({ apply, includeSystem }) {
  const entries = parseEnvFile(envPath).filter(
    ({ key }) => includeSystem || !isSystemKey(key),
  );

  if (entries.length === 0) {
    throw new Error("No exportable env keys found in .env.production.");
  }

  console.log(
    `${apply ? "Uploading" : "Dry run:"} ${entries.length} ${environment} env keys from .env.production.`,
  );

  for (const { key } of entries) {
    console.log(`- ${key}`);
  }

  if (!apply) {
    console.log("");
    console.log("No Vercel changes made. Re-run with --apply to upload.");
    return;
  }

  for (const { key, value } of entries) {
    const args = ["env", "add", key, environment, "--force", "--yes"];

    if (key.startsWith("NEXT_PUBLIC_")) {
      args.push("--no-sensitive");
    }

    await run("vercel", args, { input: value });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (
    args.command === "help" ||
    args.command === "--help" ||
    args.command === "-h"
  ) {
    printHelp();
    return;
  }

  if (args.command === "import" || args.command === "pull") {
    await importProductionEnv();
    return;
  }

  if (args.command === "export" || args.command === "push") {
    await exportProductionEnv(args);
    return;
  }

  throw new Error(`Unknown command "${args.command}".`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
