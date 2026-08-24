import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const baseline = JSON.parse(
  readFileSync(new URL("../eslint-baseline.json", import.meta.url), "utf8"),
);
const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(command, ["exec", "eslint", ".", "--format", "json"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 50 * 1024 * 1024,
});

if (result.error) {
  console.error(`Unable to run ESLint: ${result.error.message}`);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error(result.stderr || result.stdout || "ESLint did not return JSON.");
  process.exit(1);
}

const totals = report.reduce(
  (sum, file) => ({
    errors: sum.errors + file.errorCount,
    warnings: sum.warnings + file.warningCount,
  }),
  { errors: 0, warnings: 0 },
);

console.log(
  `ESLint baseline: ${totals.errors}/${baseline.maxErrors} errors, ` +
    `${totals.warnings}/${baseline.maxWarnings} warnings.`,
);

if (totals.errors > baseline.maxErrors || totals.warnings > baseline.maxWarnings) {
  console.error("ESLint debt increased. Fix the regression before merging.");
  process.exit(1);
}

if (totals.errors < baseline.maxErrors || totals.warnings < baseline.maxWarnings) {
  console.log("ESLint debt decreased; lower eslint-baseline.json in this change.");
}
