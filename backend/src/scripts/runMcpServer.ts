import { spawn } from "node:child_process";
import { loadConfig } from "../config/env.js";

async function main(): Promise<void> {
  const env = await loadConfig();
  if (!env.MDB_MCP_READ_ONLY) {
    console.error(
      "[mcp] REFUSING TO START: MDB_MCP_READ_ONLY is not 'true'.\n" +
        "      This project mandates read-only access to protect data.\n" +
        "      Set MDB_MCP_READ_ONLY=true in .env."
    );
    process.exit(1);
  }

  console.error("[mcp] Launching @mongodb-js/mongodb-mcp-server (READ-ONLY)…");
  console.error(`[mcp] Database: ${env.MDB_DATABASE_NAME}`);

  const child = spawn(
    "npx",
    ["-y", "@mongodb-js/mongodb-mcp-server"],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        MDB_MCP_CONNECTION_STRING: env.MDB_MCP_CONNECTION_STRING,
        MDB_MCP_READ_ONLY: "true",
      },
    }
  );

  child.on("exit", (code) => process.exit(code ?? 0));
  child.on("error", (err) => {
    console.error("[mcp] Failed to launch MCP server:", err);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error("[mcp] Fatal:", err);
  process.exit(1);
});
