import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
config({ path: new URL("../.env.local", import.meta.url).pathname, quiet: true });

const rawUrl = process.env.TEST_DATABASE_URL;
if (!rawUrl) {
  console.error("TEST_DATABASE_URL is required. Copy .env.example to .env.local and configure cscn_test.");
  process.exit(1);
}

let databaseUrl;
try {
  databaseUrl = new URL(rawUrl);
} catch {
  console.error("TEST_DATABASE_URL must be a valid PostgreSQL URL.");
  process.exit(1);
}

const databaseName = databaseUrl.pathname.replace(/^\//, "");
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(databaseUrl.hostname);
if (!isLocal || databaseName !== "cscn_test") {
  console.error("Refusing reset: the target must be the local database named exactly cscn_test.");
  process.exit(1);
}

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(
  command,
  ["exec", "prisma", "migrate", "reset", "--force"],
  {
    cwd: root,
    env: {
      ...process.env,
      DATABASE_ADAPTER: "pg",
      DATABASE_URL: rawUrl,
      DIRECT_URL: rawUrl,
    },
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
