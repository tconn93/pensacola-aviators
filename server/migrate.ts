import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("[migrate] DATABASE_URL is required");
  process.exit(1);
}

const migrationsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "migrations",
);

async function main() {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
  const client = await pool.connect();
  try {
    await client.query(
      `create table if not exists _migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )`,
    );
    const applied = new Set(
      (await client.query("select name from _migrations")).rows.map(
        (r: { name: string }) => r.name,
      ),
    );
    const files = (await readdir(migrationsDir))
      .filter((f) => f.endsWith(".sql"))
      .sort();
    let count = 0;
    for (const name of files) {
      if (applied.has(name)) continue;
      const text = await readFile(path.join(migrationsDir, name), "utf8");
      await client.query("begin");
      try {
        await client.query(text);
        await client.query("insert into _migrations (name) values ($1)", [name]);
        await client.query("commit");
        console.log(`[migrate] applied ${name}`);
        count += 1;
      } catch (err) {
        await client.query("rollback");
        throw err;
      }
    }
    console.log(
      count
        ? `[migrate] done — ${count} migration(s)`
        : "[migrate] up to date",
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
