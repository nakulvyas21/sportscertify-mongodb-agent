# Sportscertify Social — World Cup 2026 Talent & Content Discovery Agent

A specialized **social network for certified sports professionals** (coaches, referees, sports
scientists, analysts), centered on 2026 World Cup tactical analysis and sports-science content.

This is a **monorepo** with two independently deployable apps:

| Folder | What it is | Stack | Deploy |
| --- | --- | --- | --- |
| [`backend/`](backend/) | The agent + data layer — Gemini agent, read-only MongoDB MCP, Atlas Vector Search, REST API | Node.js / TypeScript | Cloud Run |
| [`frontend/`](frontend/) | The SEO-first social web app (server-rendered) | Angular SSR | Cloud Run + Firebase Hosting |

> **Why a monorepo?** Easier local development — one clone, both apps, MIT license at the top
> level.

---

## Repository layout

```
sportscertify-social/
├── backend/      # Node/TS — agent, MCP, MongoDB, vector search, REST API
│   ├── src/
│   ├── atlas/
│   ├── docs/     # DEPLOY.md
│   └── README.md # ← detailed backend docs
├── frontend/     # Angular SSR — SEO-first social web app
├── LICENSE       # MIT
└── README.md     # this file
```

## Data & safety boundaries

- The social data lives in a **separate, temporary** MongoDB Atlas cluster.
- The MongoDB MCP server runs **read-only** (`MDB_MCP_READ_ONLY=true`) — the agent can never
  mutate the cluster.
- Certification records appear only as a read-only snapshot on user profiles; the underlying
  certification system is never written to.

## License

[MIT](LICENSE) © 2026 Sportscertify.
