import bcrypt from "bcryptjs";
import { query } from "./db.js";

const rows = await query("SELECT id, email, name FROM admin_users ORDER BY id");
for (const r of rows as { id: number; email: string; name: string | null }[]) {
  const pwRow = await query("SELECT password_hash FROM admin_users WHERE id = $1", [r.id]);
  const match = await bcrypt.compare("aviators", (pwRow[0] as { password_hash: string }).password_hash);
  if (!match) console.log(`${r.email} (${r.name || "no name"})`);
}
