import { closeDb } from "../config/db.js";
import { findCertifiedProfessionals, searchPosts } from "../services/search.js";

async function main(): Promise<void> {
  const query =
    process.argv.slice(2).join(" ") ||
    "high-altitude endurance and acclimatisation strategies";

  console.log(`\n🔎 Semantic search: "${query}"\n`);
  const hits = await searchPosts(query, { limit: 4 });

  if (hits.length === 0) {
    console.log(
      "No results. Have you run `npm run seed` (with VOYAGE_API_KEY set) " +
        "and `npm run create-index`?"
    );
    return;
  }

  for (const hit of hits) {
    console.log(`  [${hit.score.toFixed(4)}] @${hit.author_handle} (${hit.author_role})`);
    console.log(`    ${hit.content.slice(0, 140)}…`);
    console.log(`    tags: ${hit.tags.join(" ")}\n`);
  }

  console.log("🤝 Cross-referencing certified conditioning specialists…\n");
  const coaches = await findCertifiedProfessionals({
    role: "Strength & Conditioning Coach",
    specialization: "conditioning",
  });
  for (const c of coaches) {
    console.log(`  @${c.handle} — ${c.display_name} (${c.role})`);
    console.log(
      `    specializations: ${c.sportscertify_credentials.specializations.join(", ")}\n`
    );
  }
}

main()
  .catch((err) => {
    console.error("[search] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
