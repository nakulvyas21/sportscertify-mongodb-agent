import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "./jwt.js";
import { authenticatePat } from "./pat.js";

export interface AuthContext {
  subject: string;
  method: "pat" | "jwt";
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export async function attachUser(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization ?? "";

  try {
    if (header.startsWith("PAT ")) {
      const subject = await authenticatePat(header.slice(4).trim());
      if (subject) req.auth = { subject, method: "pat" };
    } else if (header.startsWith("Bearer ")) {
      const claims = verifyAccessToken(header.slice(7).trim());
      if (claims?.sub) req.auth = { subject: claims.sub, method: "jwt" };
    }
  } catch {
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  next();
}
