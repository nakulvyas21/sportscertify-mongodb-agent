import express, { type Request, type Response } from "express";
import { closeDb, getDb } from "../config/db.js";
import { COLLECTIONS, loadConfig } from "../config/env.js";
import { findCertifiedProfessionals, searchPosts } from "../services/search.js";
import type { ProfessionalRole } from "../types/models.js";
import { attachUser, requireAuth } from "../auth/middleware.js";
import { rotateRefreshToken, revokeAllForSubject } from "../auth/jwt.js";
import {
  authRateLimiter,
  corsMiddleware,
  globalRateLimiter,
  securityHeaders,
} from "./security.js";

async function start(): Promise<void> {
  const env = await loadConfig();

  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(securityHeaders());
  app.use(corsMiddleware());
  app.use(globalRateLimiter);
  app.use(attachUser);

  app.get("/health", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      await db.command({ ping: 1 });
      res.json({
        status: "ok",
        database: env.MDB_DATABASE_NAME,
        read_only: env.MDB_MCP_READ_ONLY,
        production: env.IS_PRODUCTION,
      });
    } catch (err) {
      res.status(503).json({ status: "error", message: (err as Error).message });
    }
  });

  app.post("/auth/refresh", authRateLimiter, async (req: Request, res: Response) => {
    const token = String(req.body?.refresh_token ?? "");
    if (!token) {
      res.status(400).json({ error: "refresh_token is required." });
      return;
    }
    try {
      const pair = await rotateRefreshToken(token);
      res.json(pair);
    } catch (err) {
      res.status(401).json({ error: (err as Error).message });
    }
  });

  app.post("/auth/logout", requireAuth, async (req: Request, res: Response) => {
    await revokeAllForSubject(req.auth!.subject);
    res.json({ status: "ok" });
  });

  app.get("/me", requireAuth, (req: Request, res: Response) => {
    res.json({ subject: req.auth!.subject, method: req.auth!.method });
  });

  app.get("/feed", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      const feed = await db
        .collection(COLLECTIONS.posts)
        .find({}, { projection: { content_embedding: 0 } })
        .sort({ created_at: -1 })
        .limit(20)
        .toArray();
      res.json({ count: feed.length, posts: feed });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/search", async (req: Request, res: Response) => {
    const q = String(req.query.q ?? "").trim();
    if (!q) {
      res.status(400).json({ error: "Missing required query param `q`." });
      return;
    }
    try {
      const limit = Math.min(Number(req.query.limit) || 5, 20);
      const hits = await searchPosts(q, { limit });
      res.json({ query: q, count: hits.length, hits });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/professionals", async (req: Request, res: Response) => {
    try {
      const role = req.query.role ? (String(req.query.role) as ProfessionalRole) : undefined;
      const specialization = req.query.specialization
        ? String(req.query.specialization)
        : undefined;
      const results = await findCertifiedProfessionals({ role, specialization });
      res.json({ count: results.length, professionals: results });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/post/:slug", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      const post = await db
        .collection(COLLECTIONS.posts)
        .findOne({ slug: String(req.params.slug) }, { projection: { content_embedding: 0 } });
      if (!post) {
        res.status(404).json({ error: "Post not found." });
        return;
      }
      res.json({ post });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/professionals/:handle", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      const user = await db
        .collection(COLLECTIONS.users)
        .findOne({ handle: String(req.params.handle) }, { projection: { _id: 0 } });
      if (!user) {
        res.status(404).json({ error: "Professional not found." });
        return;
      }
      const authored = await db
        .collection(COLLECTIONS.posts)
        .find(
          { author_handle: String(req.params.handle) },
          { projection: { content_embedding: 0 } }
        )
        .sort({ created_at: -1 })
        .toArray();
      res.json({ professional: user, posts: authored });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  const server = app.listen(env.PORT, () => {
    console.log(`[api] Sportscertify Social API listening on :${env.PORT}`);
    console.log(`[api] Production: ${env.IS_PRODUCTION} · Read-only DB agent: ${env.MDB_MCP_READ_ONLY}`);
  });

  async function shutdown(): Promise<void> {
    console.log("\n[api] Shutting down…");
    server.close();
    await closeDb();
    process.exit(0);
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("[api] Fatal startup error:", err);
  process.exit(1);
});
