import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { closeDb, getDb } from "../config/db.js";
import { COLLECTIONS, loadConfig } from "../config/env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX_JSON_PATH = resolve(__dirname, "../../atlas/vector-index.json");

interface VectorIndexFile {
  name: string;
  type: "vectorSearch";
  definition: Record<string, unknown>;
}

interface SearchIndexStatus {
  name: string;
  queryable?: boolean;
  status?: string;
}

async function main(): Promise<void> {
  const env = await loadConfig();
  const raw = await readFile(INDEX_JSON_PATH, "utf-8");
  const indexDef = JSON.parse(raw) as VectorIndexFile;

  const db = await getDb();
  const collection = db.collection(COLLECTIONS.posts);

  const existing = (await collection
    .listSearchIndexes()
    .toArray()) as SearchIndexStatus[];
  if (existing.some((i) => i.name === indexDef.name)) {
    console.log(`[index] Dropping existing search index: ${indexDef.name}`);
    await collection.dropSearchIndex(indexDef.name);
    await new Promise((r) => setTimeout(r, 5000));
  }

  console.log(`[index] Creating vector index "${indexDef.name}"…`);
  await collection.createSearchIndex({
    name: indexDef.name,
    type: indexDef.type,
    definition: indexDef.definition,
  });

  console.log("[index] Waiting for index to become queryable (this can take ~1-2 min)…");
  for (let attempt = 0; attempt < 60; attempt++) {
    const indexes = (await collection
      .listSearchIndexes()
      .toArray()) as SearchIndexStatus[];
    const target = indexes.find((i) => i.name === indexDef.name);
    if (target?.queryable) {
      console.log(`[index] ✅ Index "${indexDef.name}" is queryable.`);
      console.log(`[index] VECTOR_INDEX_NAME in .env should be: ${env.VECTOR_INDEX_NAME}`);
      return;
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 3000));
  }
  console.warn(
    "\n[index] Index created but not yet queryable after timeout. " +
      "Check status in the Atlas UI; it will finish building shortly."
  );
}

main()
  .catch((err) => {
    console.error("[index] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
