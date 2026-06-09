import { createHash, randomBytes } from "node:crypto";
import { getDb } from "../config/db.js";

const PAT_COLLECTION = "personal_access_tokens";

export interface PatRecord {
  name: string;
  token_hash: string;
  subject: string;
  is_active: boolean;
  expires_at: Date | null;
  created_at: Date;
  last_used_at: Date | null;
}

const hash = (raw: string): string => createHash("sha256").update(raw).digest("hex");

export async function createPat(opts: {
  name: string;
  subject: string;
  expiresAt?: Date | null;
}): Promise<string> {
  const raw = `pat_${randomBytes(24).toString("hex")}`;
  const db = await getDb();
  await db.collection<PatRecord>(PAT_COLLECTION).insertOne({
    name: opts.name,
    token_hash: hash(raw),
    subject: opts.subject,
    is_active: true,
    expires_at: opts.expiresAt ?? null,
    created_at: new Date(),
    last_used_at: null,
  });
  return raw;
}

export async function authenticatePat(rawToken: string): Promise<string | null> {
  const db = await getDb();
  const coll = db.collection<PatRecord>(PAT_COLLECTION);
  const record = await coll.findOne({ token_hash: hash(rawToken), is_active: true });
  if (!record) return null;
  if (record.expires_at && record.expires_at.getTime() < Date.now()) return null;

  await coll.updateOne({ _id: (record as any)._id }, { $set: { last_used_at: new Date() } });
  return record.subject;
}
