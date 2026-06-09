# Sportscertify Social — World Cup 2026 Talent & Content Discovery Agent

A specialized **social network for certified sports professionals** (coaches, referees, sports
scientists, analysts), centered on 2026 World Cup tactical analysis and sports-science content.

The platform pairs a polymorphic, deeply-nested MongoDB social schema with **Atlas Vector
Search** (powered by **Voyage AI `voyage-4-large`**) and a **Gemini agent** that reasons over the
data through the official **MongoDB Model Context Protocol (MCP)** server — running in
**strict read-only mode** for data safety.

> **Isolation note.** This `backend/` app does **not** touch, import, or depend on any existing
> course/certification backend. The 10-module sports-science certification continues to run
> untouched on its original system; here it appears only as a read-only
> `sportscertify_credentials` snapshot on user profiles — a "LinkedIn Learning"-style add-on to
> the social layer.

---

This is the `backend/` folder of the [monorepo](../README.md) — the agent + data + MCP core.
The SEO web frontend is the sibling [`../frontend/`](../frontend/) folder, and the MIT license
is at the [repo root](../LICENSE).

The flagship agent query — *"Search our World Cup feed for performance data on high-altitude
endurance and cross-reference certified conditioning coaches"* — runs through Vertex AI (Gemini)
over the read-only MongoDB MCP toolset. See
[src/agent/system-instructions.md](src/agent/system-instructions.md) and the
[Quick start](#quick-start) below to run it.

---

## Architecture

```
┌──────────────────────────────┐        ┌───────────────────────────────┐
│  Gemini Agent (Agent Builder) │        │  Frontend feed / REST clients │
│  "World Cup Talent Scout"     │        │  GET /feed /search /pros      │
└───────────────┬──────────────┘        └───────────────┬───────────────┘
                │ MCP (read-only, stdio)                 │ HTTP
                ▼                                        ▼
   ┌─────────────────────────────┐         ┌──────────────────────────────┐
   │ @mongodb-js/mongodb-mcp-server│        │  Express API (src/api)        │
   │ MDB_MCP_READ_ONLY=true        │        │  reuses src/services/search   │
   └───────────────┬──────────────┘         └───────────────┬──────────────┘
                   │                                         │
                   └──────────────┬──────────────────────────┘
                                  ▼
              ┌───────────────────────────────────────────┐
              │  MongoDB Atlas (TEMPORARY cluster)         │
              │  db: sportscertify_social                  │
              │  collections: users, posts                 │
              │  Atlas Vector Search: posts_content_vector_index │
              └───────────────────────────────────────────┘
                                  ▲
                                  │ voyage-4-large embeddings (1024-dim)
                       ┌──────────┴───────────┐
                       │  Voyage AI (seed +    │
                       │  query embedding)     │
                       └──────────────────────┘
```

## Tech stack

| Layer        | Choice                                                        |
| ------------ | ------------------------------------------------------------- |
| Language     | Node.js 20+ / TypeScript (ESM)                                |
| Database     | MongoDB Atlas (temporary cluster)                             |
| Vector engine| MongoDB Atlas Vector Search + Voyage AI `voyage-4-large`      |
| Tool layer   | `@mongodb-js/mongodb-mcp-server` (**read-only**)              |
| Agent brain  | Gemini via Google Cloud Agent Builder                         |
| API          | Express (read-only endpoints mirroring the agent's skills)    |

## Repository layout

```
sportscertify-social/
├── atlas/
│   └── vector-index.json          # Atlas Vector Search index definition
├── src/
│   ├── agent/
│   │   ├── system-instructions.md # Paste into Agent Builder
│   │   └── mcp-config.json         # MCP toolset registration
│   ├── api/
│   │   └── server.ts               # Read-only REST API
│   ├── config/
│   │   ├── db.ts                   # Shared MongoClient
│   │   └── env.ts                  # Validated env (zod)
│   ├── scripts/
│   │   ├── data.ts                 # World Cup 2026 seed data
│   │   ├── seed.ts                 # Seeder (embeds via Voyage, inserts)
│   │   ├── createVectorIndex.ts    # Builds the Atlas vector index
│   │   ├── searchDemo.ts           # CLI semantic-search demo
│   │   └── runMcpServer.ts         # Read-only MCP launcher
│   ├── services/
│   │   ├── voyage.ts               # voyage-4-large embeddings
│   │   └── search.ts               # $vectorSearch + relational lookups
│   └── types/
│       └── models.ts               # Polymorphic nested schema
├── .vscode/mcp.json                # Local MCP testing config
├── .env.example                    # Copy → .env
├── LICENSE                         # MIT
├── tsconfig.json
└── package.json
```

---

## Quick start

### 0. Prerequisites

- Node.js **20+**
- A **new, temporary** [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (the free **M0**
  tier supports Atlas Vector Search). **Do not reuse a production cluster.**
- A [Voyage AI](https://www.voyageai.com/) API key (for `voyage-4-large` embeddings).
- (For the agent) A Google Cloud project with **Agent Builder** / Vertex AI enabled.

### 1. Create and initialize the isolated repository

```bash
# This project lives in its OWN repo, separate from any existing codebase.
cd sportscertify-social

git init
git add .
git commit -m "chore: scaffold Sportscertify Social (World Cup 2026 agent)"

# Create the new GitHub repo and push (requires the GitHub CLI, `gh`):
gh repo create sportscertify-social --public --source=. --remote=origin --push
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env and set:
#   MDB_MCP_CONNECTION_STRING  → your TEMPORARY Atlas cluster
#   VOYAGE_API_KEY             → your Voyage AI key
#   (MDB_MCP_READ_ONLY stays "true")
```

### 4. Seed the temporary cluster

```bash
npm run seed
```

This drops & recreates `users` and `posts`, generates `voyage-4-large` embeddings for every
post's `content`, inserts the World Cup 2026 dataset, and builds supporting indexes.

### 5. Create the Atlas Vector Search index

Either programmatically:

```bash
npm run create-index
```

…or paste the `definition` block from [`atlas/vector-index.json`](atlas/vector-index.json) into
**Atlas UI → Atlas Search → Create Search Index → JSON Editor**, on database
`sportscertify_social`, collection `posts`, index name `posts_content_vector_index`.

### 6. Try a semantic search

```bash
npm run search "high-altitude endurance conditioning"
```

You'll see vector-ranked World Cup posts followed by cross-referenced certified conditioning
coaches — the exact two-step flow the Gemini agent performs.

### 7. (Optional) Run the read-only REST API

```bash
npm run dev
# then:
curl "http://localhost:8080/health"
curl "http://localhost:8080/search?q=altitude%20endurance"
curl "http://localhost:8080/professionals?role=Strength%20%26%20Conditioning%20Coach"
```

---

## The read-only MongoDB MCP server

The agent never talks to MongoDB directly — it goes through the official MongoDB MCP server,
which we pin to **read-only** so the agent physically cannot mutate the temporary cluster.

### Spin it up locally

```bash
# Wrapper that REFUSES to start unless MDB_MCP_READ_ONLY=true:
npm run mcp
```

Equivalent raw invocation (what the wrapper enforces):

```bash
MDB_MCP_CONNECTION_STRING="$MDB_MCP_CONNECTION_STRING" \
MDB_MCP_READ_ONLY=true \
npx -y @mongodb-js/mongodb-mcp-server
```

The `MDB_MCP_READ_ONLY=true` flag disables every write/admin tool (insert, update, delete, drop,
createCollection, etc.). Only query and aggregation tools — including `$vectorSearch` — remain
available.

### Test it in VS Code

[`.vscode/mcp.json`](.vscode/mcp.json) registers the same server for local testing. Export
`MDB_MCP_CONNECTION_STRING` in your shell, then **Command Palette → "MCP: List Servers" → start
`mongodb-social-readonly`**.

---

## Registering the toolset in Google Cloud Agent Builder

1. **Stand up the MCP endpoint.** Run the read-only server (`npm run mcp`) somewhere your agent
   can reach it. For Agent Builder, host it behind an MCP-compatible endpoint (e.g. a small Cloud
   Run service that runs `npx -y @mongodb-js/mongodb-mcp-server` with the env vars from
   [`src/agent/mcp-config.json`](src/agent/mcp-config.json)). Keep `MDB_MCP_READ_ONLY=true`.
2. **Create the agent.** In **Google Cloud Console → Agent Builder**, create a new agent backed
   by Gemini (e.g. `gemini-2.0-flash`).
3. **Add the MCP toolset.** Under the agent's **Tools**, add an **MCP** tool source pointing at
   the server from step 1. Confirm only read/query/aggregate tools are listed (writes are absent
   by design).
4. **Paste the system instructions.** Copy the prompt block from
   [`src/agent/system-instructions.md`](src/agent/system-instructions.md) into the agent's
   **System Instructions** field. It documents the schema, the vector index name, and the
   Chain-of-Thought method for two-step semantic + relational queries.
5. **Test the flagship query:**
   > *"Search our World Cup feed for any performance data or tactical analyses concerning
   > high-altitude endurance, and cross-reference those insights with certified coaches in our
   > database specializing in conditioning."*

   The agent should decompose the request, run a `$vectorSearch` on `posts_content_vector_index`,
   then a relational lookup on `users`, and synthesize a cited answer.

---

## Data safety summary

- **Dedicated cluster.** Connects only to its own MongoDB Atlas cluster.
- **Read-only MCP.** `MDB_MCP_READ_ONLY=true` is enforced by both the launcher and the configs.
- **Writes are isolated to `seed.ts`**, which targets only the throwaway `sportscertify_social`
  database on your temporary cluster.
- **No secrets in git.** `.env` is git-ignored; configs reference env vars, never literals.

## License

[MIT](LICENSE) © 2026 Sportscertify.
