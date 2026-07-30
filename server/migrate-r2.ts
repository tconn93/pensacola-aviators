import { query } from "./db.js";
import { uploadToR2, isR2Configured } from "./storage.js";
import dotenv from "dotenv";

dotenv.config();

async function migrate() {
  if (!isR2Configured()) {
    console.error("[migrate-r2] R2 is not configured — skipping");
    process.exit(1);
  }

  const rows = await query<{
    id: number;
    title: string | null;
    data_url: string | null;
    mime_type: string | null;
  }>(
    `select id, title, data_url, mime_type from media_assets
     where source_type = 'upload' and data_url is not null
     order by id`,
  );

  console.log(`[migrate-r2] Found ${rows.length} image(s) to migrate`);

  for (const row of rows) {
    const dataUrl = row.data_url;
    if (!dataUrl || !dataUrl.startsWith("data:")) {
      console.log(`  [${row.id}] skipped — no data URL`);
      continue;
    }

    const mime = row.mime_type || dataUrl.split(";")[0].split(":")[1] || "image/jpeg";
    const ext = mime.split("/")[1] || "jpg";
    const base64Data = dataUrl.split(",")[1] || dataUrl;
    const buffer = Buffer.from(base64Data, "base64");
    const key = `media/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    console.log(`  [${row.id}] uploading ${(buffer.length / 1024).toFixed(0)}KB as ${key} ...`);

    const url = await uploadToR2(key, buffer, mime);
    if (!url) {
      console.error(`  [${row.id}] FAILED`);
      continue;
    }

    await query(
      `update media_assets set
        source_type = 'r2', path = $1, data_url = null
       where id = $2`,
      [url, row.id],
    );

    console.log(`  [${row.id}] done — ${url}`);
  }

  console.log("[migrate-r2] Complete");
}

migrate().catch((err) => {
  console.error("[migrate-r2] Failed:", err);
  process.exit(1);
});
