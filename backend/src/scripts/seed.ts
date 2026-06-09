import { closeDb, getDb } from "../config/db.js";
import { COLLECTIONS, loadConfig } from "../config/env.js";
import { embedDocuments, voyageConfigured } from "../services/voyage.js";
import type { PostDocument } from "../types/models.js";
import { posts, users } from "./data.js";

async function main(): Promise<void> {
  const env = await loadConfig();
  console.log("[seed] Connecting to MongoDB Atlas…");
  const db = await getDb();
  console.log(`[seed] Connected to database: ${env.MDB_DATABASE_NAME}`);

  for (const name of [COLLECTIONS.users, COLLECTIONS.posts]) {
    const exists = await db.listCollections({ name }).hasNext();
    if (exists) {
      await db.collection(name).drop();
      console.log(`[seed] Dropped existing collection: ${name}`);
    }
  }

  let enrichedPosts: PostDocument[] = posts;

  if (voyageConfigured()) {
    console.log(
      `[seed] Generating ${posts.length} embeddings with ${env.VOYAGE_MODEL} (${env.VOYAGE_EMBED_DIM} dims)…`
    );
    const embeddings = await embedDocuments(posts.map((p) => p.content));
    enrichedPosts = posts.map((p, i) => ({
      ...p,
      content_embedding: embeddings[i],
    }));
    console.log("[seed] Embeddings generated.");
  } else {
    console.warn(
      "[seed] VOYAGE_API_KEY not set — inserting posts WITHOUT embeddings.\n" +
        "         Vector search will not return results until embeddings exist.\n" +
        "         Set VOYAGE_API_KEY in .env and re-run `npm run seed`."
    );
  }

  const userResult = await db.collection(COLLECTIONS.users).insertMany(users);
  console.log(`[seed] Inserted ${userResult.insertedCount} users.`);

  const postResult = await db
    .collection(COLLECTIONS.posts)
    .insertMany(enrichedPosts);
  console.log(`[seed] Inserted ${postResult.insertedCount} posts.`);

  await db.collection(COLLECTIONS.posts).createIndexes([
    { key: { slug: 1 }, name: "idx_slug", unique: true },
    { key: { tags: 1 }, name: "idx_tags" },
    { key: { author_handle: 1 }, name: "idx_author" },
    { key: { created_at: -1 }, name: "idx_created_at" },
    { key: { post_type: 1 }, name: "idx_post_type" },
  ]);
  await db.collection(COLLECTIONS.users).createIndexes([
    { key: { handle: 1 }, name: "idx_handle", unique: true },
    { key: { role: 1 }, name: "idx_role" },
    {
      key: { "sportscertify_credentials.specializations": 1 },
      name: "idx_specializations",
    },
  ]);
  console.log("[seed] Supporting indexes created.");

  console.log(
    "\n[seed] Done. Next steps:\n" +
      "  1. Create the Atlas Vector Search index → `npm run create-index`\n" +
      "     (or paste atlas/vector-index.json into the Atlas UI).\n" +
      "  2. Try a semantic search → `npm run search \"altitude endurance conditioning\"`\n"
  );
}

main()
  .catch((err) => {
    console.error("[seed] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
