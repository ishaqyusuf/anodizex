#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDir, "..");

const terminalScripts = {
  api: {
    description: "Start only the API dev server.",
    steps: [{ command: "bun", args: ["run", "dev:api"] }],
  },
  build: {
    description: "Run the production build across the workspace.",
    steps: [{ command: "bun", args: ["run", "build"] }],
  },
  check: {
    description: "Run typecheck, lint, and production build in order.",
    steps: [
      { command: "bun", args: ["run", "typecheck"] },
      { command: "bun", args: ["run", "lint"] },
      { command: "bun", args: ["run", "build"] },
    ],
  },
  dashboard: {
    description: "Start only the dashboard dev server.",
    steps: [{ command: "bun", args: ["run", "dev:dashboard"] }],
  },
  "db:generate": {
    description: "Generate the Prisma client.",
    steps: [
      { command: "bun", args: ["run", "db:generate"], cwd: "packages/db" },
    ],
  },
  "db:migrate": {
    description: "Run Prisma migrate dev.",
    steps: [
      { command: "bun", args: ["run", "db:migrate"], cwd: "packages/db" },
    ],
  },
  "db:validate": {
    description: "Validate the Prisma schema.",
    steps: [
      { command: "bun", args: ["run", "db:validate"], cwd: "packages/db" },
    ],
  },
  dev: {
    description: "Start all dev servers.",
    steps: [{ command: "bun", args: ["run", "dev"] }],
  },
  lint: {
    description: "Run lint across the workspace.",
    steps: [{ command: "bun", args: ["run", "lint"] }],
  },
  "smoke:mvp": {
    description: "Run the local MVP auth/API/billing smoke verifier.",
    steps: [{ command: "bun", args: ["run", "smoke:mvp"] }],
  },
  "prod:dashboard": {
    description:
      "Build and start the dashboard locally with the production env.",
    steps: [
      {
        command: "bun",
        args: ["run", "--filter", "@afterservice/dashboard", "build"],
      },
      { command: "bun", args: ["run", "start:dashboard:prod"] },
    ],
  },
  "prod:website": {
    description: "Build and start the website locally with the production env.",
    steps: [
      {
        command: "bun",
        args: ["run", "--filter", "@afterservice/website", "build"],
      },
      { command: "bun", args: ["run", "start:website:prod"] },
    ],
  },
  typecheck: {
    description: "Run typecheck across the workspace.",
    steps: [{ command: "bun", args: ["run", "typecheck"] }],
  },
  website: {
    description: "Start only the website dev server.",
    steps: [{ command: "bun", args: ["run", "dev:website"] }],
  },
};

function printHelp() {
  const names = Object.keys(terminalScripts).sort();
  const nameWidth = Math.max(...names.map((name) => name.length));

  console.log("afterservice terminal scripts");
  console.log("");
  console.log("Usage:");
  console.log("  bun run terminal <script>");
  console.log("");
  console.log("Scripts:");

  for (const name of names) {
    const padding = " ".repeat(nameWidth - name.length);
    console.log(`  ${name}${padding}  ${terminalScripts[name].description}`);
  }
}

function runStep(step) {
  const stepCwd = step.cwd ? resolve(workspaceRoot, step.cwd) : workspaceRoot;
  const display = [step.command, ...step.args].join(" ");
  console.log("");
  if (step.cwd) {
    console.log(`# ${step.cwd}`);
  }
  console.log(`$ ${display}`);

  return new Promise((resolveStep, rejectStep) => {
    const child = spawn(step.command, step.args, {
      cwd: stepCwd,
      env: process.env,
      shell: process.platform === "win32",
      stdio: "inherit",
    });

    child.on("error", rejectStep);
    child.on("exit", (code, signal) => {
      if (signal) {
        rejectStep(new Error(`Command stopped by signal ${signal}.`));
        return;
      }

      if (code !== 0) {
        rejectStep(new Error(`Command exited with code ${code}.`));
        return;
      }

      resolveStep();
    });
  });
}

async function main() {
  const scriptName = process.argv[2];

  if (
    !scriptName ||
    scriptName === "list" ||
    scriptName === "--help" ||
    scriptName === "-h"
  ) {
    printHelp();
    return;
  }

  const script = terminalScripts[scriptName];

  if (!script) {
    console.error(`Unknown terminal script "${scriptName}".`);
    console.error("");
    printHelp();
    process.exit(1);
  }

  for (const step of script.steps) {
    await runStep(step);
  }
}

main().catch((error) => {
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
