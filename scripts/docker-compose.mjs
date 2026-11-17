import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const secretFile = resolve(projectRoot, "functions", ".secret.local");

let secretFileContents;
try {
  secretFileContents = readFileSync(secretFile, "utf8");
} catch (error) {
  throw new Error(
    `Cannot read ${secretFile}. Create it with RESEARCH_MODEL_API_KEY set, following the local setup instructions.`,
    { cause: error },
  );
}

const secretLine = secretFileContents
  .split(/\r?\n/)
  .find((line) => line.startsWith("RESEARCH_MODEL_API_KEY="));
const apiKey = secretLine?.slice("RESEARCH_MODEL_API_KEY=".length).trim();
if (!apiKey) {
  throw new Error(`${secretFile} must contain a non-empty RESEARCH_MODEL_API_KEY.`);
}

const result = spawnSync("docker", ["compose", ...process.argv.slice(2)], {
  cwd: projectRoot,
  env: { ...process.env, RESEARCH_MODEL_API_KEY: apiKey },
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}
process.exit(result.status ?? 1);
