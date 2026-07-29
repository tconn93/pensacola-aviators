import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { query } from "./db.js";

export type AdminSession = {
  id: number;
  email: string;
  name: string | null;
  role: string;
};

declare module "express-session" {
  interface SessionData {
    admin?: AdminSession;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.admin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export async function ensureSeedAdmin() {
  const rows = await query<{ n: number }>(
    "select count(*)::int as n from admin_users",
  );
  if ((rows[0]?.n ?? 0) > 0) return;
  const hash = await bcrypt.hash("aviators", 10);
  await query(
    `insert into admin_users (email, name, password_hash, role)
     values ($1, $2, $3, 'owner')`,
    ["admin@pcolarugby.com", "Club Admin", hash],
  );
  console.log(
    "[auth] Seeded admin@pcolarugby.com / aviators — change this password",
  );
}

export async function loginAdmin(email: string, password: string) {
  const rows = await query<{
    id: number;
    email: string;
    name: string | null;
    role: string;
    password_hash: string;
  }>(
    "select id, email, name, role, password_hash from admin_users where lower(email) = lower($1)",
    [email.trim()],
  );
  const user = rows[0];
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  } satisfies AdminSession;
}
