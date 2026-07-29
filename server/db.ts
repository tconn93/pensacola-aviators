import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.warn(
    "[db] DATABASE_URL is not set — API will fail until Postgres is configured.",
  );
}

export const pool = new pg.Pool({
  connectionString,
  ssl: connectionString && /localhost|127\.0\.0\.1/.test(connectionString)
    ? false
    : connectionString?.includes("sslmode=disable")
      ? false
      : undefined,
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await pool.query<T>(text, params);
  return res.rows;
}
