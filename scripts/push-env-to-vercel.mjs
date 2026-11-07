import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");
const content = fs.readFileSync(envPath, "utf8");
const vercel = path.join(process.cwd(), "node_modules", "vercel", "dist", "vc.js");
const environments = "production,preview,development";

function parseValue(raw) {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

for (const line of content.split(/\r?\n/)) {
  const stripped = line.trim();
  if (!stripped || stripped.startsWith("#")) continue;
  const eq = stripped.indexOf("=");
  if (eq <= 0) continue;
  const key = stripped.slice(0, eq).trim();
  if (key.startsWith("VERCEL_")) continue;
  const value = parseValue(stripped.slice(eq + 1));
  if (!value) continue;

  const args = [
    vercel,
    "env",
    "add",
    key,
    "--environment",
    environments,
    "--value",
    value,
    "--yes",
    "--force",
  ];
  if (key.startsWith("NEXT_PUBLIC_")) {
    args.push("--type", "config");
  } else {
    args.push("--sensitive");
  }

  try {
    execFileSync(process.execPath, args, { stdio: "inherit" });
    console.log(`Synced ${key}`);
  } catch {
    console.error(`Failed to sync ${key}`);
    process.exitCode = 1;
  }
}
