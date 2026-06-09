import "dotenv/config";
import { z } from "zod";
import { IS_BUILD_PHASE, IS_PRODUCTION, resolveSecret } from "./secrets.js";

const schema = z.object({
  MDB_MCP_CONNECTION_STRING: z
    .string()
    .min(1, "MDB_MCP_CONNECTION_STRING is required (Atlas connection string)"),
  MDB_DATABASE_NAME: z.string().default("sportscertify_social"),
  MDB_MCP_READ_ONLY: z
    .string()
    .default("true")
    .transform((v) => v.toLowerCase() === "true"),

  VOYAGE_API_KEY: z.string().optional(),
  VOYAGE_MODEL: z.string().default("voyage-4-large"),
  VOYAGE_EMBED_DIM: z.coerce.number().int().positive().default(1024),

  GOOGLE_CLOUD_PROJECT: z.string().default("your-gcp-project"),
  GOOGLE_CLOUD_LOCATION: z.string().default("us-central1"),
  AI_MODEL: z.string().default("gemini-2.5-flash"),

  JWT_SIGNING_KEY: z.string().min(16, "JWT_SIGNING_KEY must be set (>=16 chars)"),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 7),

  PORT: z.coerce.number().int().positive().default(8080),
  VECTOR_INDEX_NAME: z.string().default("posts_content_vector_index"),
  CORS_ALLOWED_ORIGINS: z.string().default("http://localhost:4200,http://localhost:4000"),
});

export type AppConfig = z.infer<typeof schema> & {
  IS_PRODUCTION: boolean;
  CORS_ORIGINS: string[];
};

let _config: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (_config) return _config;

  const [connectionString, voyageKey, jwtKey] = await Promise.all([
    resolveSecret("mdb-connection-string", "MDB_MCP_CONNECTION_STRING"),
    resolveSecret("voyage-api-key", "VOYAGE_API_KEY"),
    resolveSecret("jwt-signing-key", "JWT_SIGNING_KEY"),
  ]);

  const raw = {
    ...process.env,
    MDB_MCP_CONNECTION_STRING: connectionString ?? process.env.MDB_MCP_CONNECTION_STRING,
    VOYAGE_API_KEY: voyageKey ?? process.env.VOYAGE_API_KEY,
    JWT_SIGNING_KEY: jwtKey ?? process.env.JWT_SIGNING_KEY,
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(`\n[config] Invalid configuration:\n${issues}\n`);
    if (!IS_PRODUCTION) {
      console.error("Copy .env.example to .env and fill in the values.\n");
    }
    process.exit(1);
  }

  _config = {
    ...parsed.data,
    IS_PRODUCTION,
    CORS_ORIGINS: parsed.data.CORS_ALLOWED_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  };
  return _config;
}

export function getConfig(): AppConfig {
  if (!_config) {
    throw new Error("Config not loaded — await loadConfig() at startup first.");
  }
  return _config;
}

export { IS_BUILD_PHASE, IS_PRODUCTION };

export const COLLECTIONS = {
  users: "users",
  posts: "posts",
} as const;
