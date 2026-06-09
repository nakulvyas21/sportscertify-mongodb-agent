import jwt, { type JwtPayload } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { getDb } from "../config/db.js";
import { getConfig } from "../config/env.js";

const REFRESH_COLLECTION = "refresh_tokens";

export interface AccessClaims extends JwtPayload {
  sub: string;
  type: "access";
}

interface RefreshRecord {
  jti: string;
  subject: string;
  revoked: boolean;
  expires_at: Date;
  created_at: Date;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export async function issueTokenPair(subject: string): Promise<TokenPair> {
  const env = getConfig();
  const access = jwt.sign({ sub: subject, type: "access" }, env.JWT_SIGNING_KEY, {
    expiresIn: env.JWT_ACCESS_TTL_SECONDS,
    algorithm: "HS256",
  });

  const jti = randomUUID();
  const refresh = jwt.sign({ sub: subject, type: "refresh", jti }, env.JWT_SIGNING_KEY, {
    expiresIn: env.JWT_REFRESH_TTL_SECONDS,
    algorithm: "HS256",
  });

  const db = await getDb();
  await db.collection<RefreshRecord>(REFRESH_COLLECTION).insertOne({
    jti,
    subject,
    revoked: false,
    expires_at: new Date(Date.now() + env.JWT_REFRESH_TTL_SECONDS * 1000),
    created_at: new Date(),
  });

  return {
    access_token: access,
    refresh_token: refresh,
    token_type: "Bearer",
    expires_in: env.JWT_ACCESS_TTL_SECONDS,
  };
}

export function verifyAccessToken(token: string): AccessClaims | null {
  try {
    const decoded = jwt.verify(token, getConfig().JWT_SIGNING_KEY, {
      algorithms: ["HS256"],
    }) as AccessClaims;
    return decoded.type === "access" ? decoded : null;
  } catch {
    return null;
  }
}

export async function rotateRefreshToken(token: string): Promise<TokenPair> {
  const env = getConfig();
  let decoded: JwtPayload & { jti?: string; type?: string; sub?: string };
  try {
    decoded = jwt.verify(token, env.JWT_SIGNING_KEY, { algorithms: ["HS256"] }) as JwtPayload;
  } catch {
    throw new Error("Invalid or expired refresh token.");
  }
  if (decoded.type !== "refresh" || !decoded.jti || !decoded.sub) {
    throw new Error("Not a valid refresh token.");
  }

  const db = await getDb();
  const coll = db.collection<RefreshRecord>(REFRESH_COLLECTION);

  const result = await coll.findOneAndUpdate(
    { jti: decoded.jti, revoked: false },
    { $set: { revoked: true } }
  );
  if (!result) {
    throw new Error("Refresh token already used or revoked.");
  }

  return issueTokenPair(decoded.sub);
}

export async function revokeAllForSubject(subject: string): Promise<void> {
  const db = await getDb();
  await db
    .collection<RefreshRecord>(REFRESH_COLLECTION)
    .updateMany({ subject, revoked: false }, { $set: { revoked: true } });
}
