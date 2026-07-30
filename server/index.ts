import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectPg from "connect-pg-simple";
import dotenv from "dotenv";
import { pool, query } from "./db.js";
import { ensureSeedAdmin, loginAdmin, requireAdmin, updateAdminPassword } from "./auth.js";

// ─── In-memory settings cache ────────────────────────────────────────────────

let _settingsCache: Record<string, string> | null = null;
let _cachePromise: Promise<Record<string, string>> | null = null;

async function loadSettings(): Promise<Record<string, string>> {
  const rows = await query<{ key: string; value: string }>(
    `select key, value from club_settings`,
  );
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  _settingsCache = map;
  return map;
}

async function getSettings(): Promise<Record<string, string>> {
  if (_settingsCache) return _settingsCache;
  if (_cachePromise) return _cachePromise;
  _cachePromise = loadSettings().finally(() => { _cachePromise = null; });
  return _cachePromise;
}

async function refreshSettings(): Promise<Record<string, string>> {
  _settingsCache = null;
  return getSettings();
}

function jsonArr(map: Record<string, string>, key: string, fallback: string): unknown[] {
  try { return JSON.parse(map[key] || fallback); } catch { return JSON.parse(fallback); }
}

function setting(map: Record<string, string>, key: string, fallback: string): string {
  const v = map[key];
  return v !== undefined && v !== "" ? v : fallback;
}

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3001);
const isProd = process.env.NODE_ENV === "production";

const PgSession = connectPg(session);

app.set("trust proxy", 1);
app.use(
  cors({
    origin: isProd ? true : ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "dev-insecure-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 14,
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
    },
  }),
);

// ─── Public ───────────────────────────────────────────────────────────────

app.get("/api/health", async (_req, res) => {
  try {
    await query("select 1");
    res.json({ ok: true, db: "postgres" });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

app.get("/api/site", async (_req, res) => {
  try {
    const map = await getSettings();
    const media = await query<{
      id: number;
      title: string | null;
      alt: string;
      caption: string | null;
      source_type: string;
      path: string | null;
      data_url: string | null;
      show_in_gallery: boolean;
      show_on_home: boolean;
      sort_order: number;
    }>(
      `select id, title, alt, caption, source_type, path, data_url,
              show_in_gallery, show_on_home, sort_order
       from media_assets
       where published = true and (show_in_gallery or show_on_home)
       order by sort_order asc, id asc`,
    );
    const images = media.map((m) => ({
      id: m.id,
      title: m.title,
      alt: m.alt,
      caption: m.caption,
      url: m.source_type === "path" && m.path ? m.path : m.data_url || m.path || "",
      show_in_gallery: m.show_in_gallery,
      show_on_home: m.show_on_home,
      sort_order: m.sort_order,
    }));
    const season = map.current_season || "Season";
    const matches = await query(
      `select id, season, team, opponent, match_date, kickoff_time, location,
              venue, status, our_score, their_score, notes, published
       from matches
       where published = true
         and (season = $1 or (status = 'final' and match_date >= current_date - 120))
       order by match_date asc, id asc`,
      [season],
    );

    res.json({
      presentation: {
        homepage_template: map.homepage_template || "carousel",
        homepage_headline: map.homepage_headline || "Pensacola Aviators",
        homepage_subhead:
          map.homepage_subhead ||
          "Hard-running club rugby on the Gulf Coast.",
        homepage_cta_label: map.homepage_cta_label || "Join the club",
        current_season: season,
      },
      club_content: {
        motto: map.motto || "Fly the pitch",
        practice_days: map.practice_days || "Tuesdays & Thursdays",
        practice_time: map.practice_time || "6:00 – 8:00 PM",
        practice_note: map.practice_note || "Open training — first-timers welcome",
        pitch_address: map.pitch_address || "555 E Nine Mile Rd",
        pitch_city: map.pitch_city || "Pensacola, FL",
        pitch_maps_url: map.pitch_maps_url || "",
        instagram_url: map.instagram_url || "https://www.instagram.com/pensacola_rugby/",
        facebook_url: map.facebook_url || "https://www.facebook.com/pensacolarugby/",
        about_body: map.about_body || "",
        practice_body: map.practice_body || "",
        join_body: map.join_body || "",
        sponsor_blurb: map.sponsor_blurb || "Thanks to the businesses that keep the club flying.",
        duration: map.duration || "2 hours",
        first_session: map.first_session || "Free",
        sponsor_name: map.sponsor_name || "Local partners",
        stats: jsonArr(map, "stats", '[{"value":"Est.","label":"Gulf Coast club"},{"value":"2×","label":"Weekly training"},{"value":"15s","label":"& Sevens"},{"value":"Open","label":"Always recruiting"}]'),
        values: jsonArr(map, "values", '[{"title":"Pack","body":"We train together, compete together, and lift each other after the whistle."},{"title":"Grit","body":"Fitness, collisions, and second effort — that\u0027s the Aviator way."},{"title":"Community","body":"From first-timers to veterans, everyone has a role in the club."}]'),
        teams: jsonArr(map, "teams", '[{"name":"Aviators","side":"Men\u0027s","description":"Men\u0027s club side competing in fifteens seasons and sevens weekends across the Southeast."},{"name":"Aviatrix","side":"Women\u0027s","description":"Women\u0027s club side — skill development, competition, and a strong club culture."}]'),
        join_steps: jsonArr(map, "join_steps", '[{"step":"01","title":"Show up to practice","body":"Tuesdays and Thursdays at 6 PM. No tryout — just introduce yourself."},{"step":"02","title":"Train with the squad","body":"Learn the game, build fitness, and earn your spot in the pack or backline."},{"step":"03","title":"Play for Pensacola","body":"Represent the Aviators or Aviatrix in season games and sevens weekends."}]'),
      },
      homeImages: images.filter((i) => i.show_on_home),
      galleryImages: images.filter((i) => i.show_in_gallery),
      matches,
      sponsors: await query(
        `select id, name, blurb, logo_url, website_url, sort_order
         from sponsors where published = true order by sort_order asc, id asc`,
      ),
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to load site",
    });
  }
});

app.post("/api/inquiries", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim().slice(0, 120);
    const contact = String(req.body?.contact || "").trim().slice(0, 200);
    const note = String(req.body?.note || "").trim().slice(0, 2000) || null;
    if (name.length < 2) return res.status(400).json({ error: "Name required" });
    if (contact.length < 3)
      return res.status(400).json({ error: "Phone or email required" });
    const rows = await query<{ id: number }>(
      `insert into inquiries (name, contact, note) values ($1,$2,$3) returning id`,
      [name, contact, note],
    );
    res.json({ ok: true, id: rows[0]?.id });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Submit failed",
    });
  }
});

// ─── Auth ─────────────────────────────────────────────────────────────────

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "");
    const password = String(req.body?.password || "");
    const result = await loginAdmin(email, password);
    if (!result) return res.status(401).json({ error: "Invalid credentials" });
    req.session.admin = { ...result.admin, needsPasswordChange: result.needsPasswordChange };
    res.json({ ok: true, admin: req.session.admin, needs_password_change: result.needsPasswordChange });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Login failed",
    });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session?.admin) return res.status(401).json({ error: "Unauthorized" });
  res.json({ admin: req.session.admin });
});

// ─── Admin: inquiries ─────────────────────────────────────────────────────

app.get("/api/admin/inquiries", requireAdmin, async (_req, res) => {
  const rows = await query(
    `select id, name, contact, note, status, created_at
     from inquiries order by created_at desc`,
  );
  res.json(rows);
});

app.patch("/api/admin/inquiries/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || "");
  if (!["new", "read", "contacted", "archived"].includes(status))
    return res.status(400).json({ error: "Invalid status" });
  await query(`update inquiries set status = $1 where id = $2`, [status, id]);
  res.json({ ok: true });
});

app.delete("/api/admin/inquiries/:id", requireAdmin, async (req, res) => {
  await query(`delete from inquiries where id = $1`, [Number(req.params.id)]);
  res.json({ ok: true });
});

// ─── Admin: matches ───────────────────────────────────────────────────────

app.get("/api/admin/matches", requireAdmin, async (_req, res) => {
  const seasonRows = await query<{ value: string }>(
    `select value from club_settings where key = 'current_season'`,
  );
  const matches = await query(
    `select * from matches order by match_date desc, id desc`,
  );
  res.json({
    currentSeason: seasonRows[0]?.value || "Fall 2026",
    matches,
  });
});

app.post("/api/admin/season", requireAdmin, async (req, res) => {
  const season = String(req.body?.season || "").trim().slice(0, 80);
  if (season.length < 2) return res.status(400).json({ error: "Season required" });
  await query(
    `insert into club_settings (key, value) values ('current_season', $1)
     on conflict (key) do update set value = excluded.value`,
    [season],
  );
  res.json({ ok: true, season });
});

app.post("/api/admin/matches", requireAdmin, async (req, res) => {
  const b = req.body || {};
  const rows = await query<{ id: number }>(
    `insert into matches (
      season, team, opponent, match_date, kickoff_time, location, venue,
      status, our_score, their_score, notes, published
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,
    [
      String(b.season || "").trim(),
      b.team || "aviators",
      String(b.opponent || "").trim(),
      b.match_date,
      b.kickoff_time || null,
      b.location || "home",
      b.venue || null,
      b.status || "scheduled",
      b.our_score ?? null,
      b.their_score ?? null,
      b.notes || null,
      b.published !== false,
    ],
  );
  res.json({ ok: true, id: rows[0]?.id });
});

app.put("/api/admin/matches/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  await query(
    `update matches set
      season=$1, team=$2, opponent=$3, match_date=$4, kickoff_time=$5,
      location=$6, venue=$7, status=$8, our_score=$9, their_score=$10,
      notes=$11, published=$12, updated_at=now()
     where id=$13`,
    [
      b.season,
      b.team,
      b.opponent,
      b.match_date,
      b.kickoff_time || null,
      b.location,
      b.venue || null,
      b.status,
      b.our_score ?? null,
      b.their_score ?? null,
      b.notes || null,
      b.published !== false,
      id,
    ],
  );
  res.json({ ok: true });
});

app.delete("/api/admin/matches/:id", requireAdmin, async (req, res) => {
  await query(`delete from matches where id = $1`, [Number(req.params.id)]);
  res.json({ ok: true });
});

// ─── Admin: media ─────────────────────────────────────────────────────────

app.get("/api/admin/media", requireAdmin, async (_req, res) => {
  const rows = await query(`select * from media_assets order by sort_order, id desc`);
  res.json(
    rows.map((m: Record<string, unknown>) => ({
      ...m,
      url:
        m.source_type === "path" && m.path
          ? m.path
          : m.data_url || m.path || "",
    })),
  );
});

app.post("/api/admin/media", requireAdmin, async (req, res) => {
  const b = req.body || {};
  const dataUrl = String(b.dataUrl || "");
  if (!dataUrl.startsWith("data:image/"))
    return res.status(400).json({ error: "Image data URL required" });
  if (dataUrl.length > 1_800_000)
    return res.status(400).json({ error: "Image too large (max ~1.2MB)" });
  const max = await query<{ m: number | null }>(
    `select max(sort_order) as m from media_assets`,
  );
  const sort = (max[0]?.m ?? 0) + 10;
  const rows = await query<{ id: number }>(
    `insert into media_assets (
      title, alt, caption, source_type, data_url, mime_type,
      show_in_gallery, show_on_home, published, sort_order, uploaded_by
    ) values ($1,$2,$3,'upload',$4,$5,$6,$7,$8,$9,$10) returning id`,
    [
      b.title || null,
      b.alt || "Club photo",
      b.caption || null,
      dataUrl,
      b.mime_type || null,
      b.show_in_gallery !== false,
      Boolean(b.show_on_home),
      b.published !== false,
      sort,
      req.session.admin?.email || null,
    ],
  );
  res.json({ ok: true, id: rows[0]?.id });
});

app.patch("/api/admin/media/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const cur = await query(`select * from media_assets where id = $1`, [id]);
  if (!cur[0]) return res.status(404).json({ error: "Not found" });
  const row = cur[0] as Record<string, unknown>;
  await query(
    `update media_assets set
      title=$1, alt=$2, caption=$3, show_in_gallery=$4, show_on_home=$5,
      published=$6, sort_order=$7, updated_at=now()
     where id=$8`,
    [
      b.title !== undefined ? b.title : row.title,
      b.alt !== undefined ? b.alt : row.alt,
      b.caption !== undefined ? b.caption : row.caption,
      b.show_in_gallery !== undefined ? b.show_in_gallery : row.show_in_gallery,
      b.show_on_home !== undefined ? b.show_on_home : row.show_on_home,
      b.published !== undefined ? b.published : row.published,
      b.sort_order !== undefined ? b.sort_order : row.sort_order,
      id,
    ],
  );
  res.json({ ok: true });
});

app.delete("/api/admin/media/:id", requireAdmin, async (req, res) => {
  await query(`delete from media_assets where id = $1`, [Number(req.params.id)]);
  res.json({ ok: true });
});

// ─── Admin: sponsors ────────────────────────────────────────────────────

app.get("/api/admin/sponsors", requireAdmin, async (_req, res) => {
  const rows = await query(
    `select id, name, blurb, logo_url, website_url, sort_order, published, created_at
     from sponsors order by sort_order asc, id asc`,
  );
  res.json(rows);
});

app.post("/api/admin/sponsors", requireAdmin, async (req, res) => {
  const b = req.body || {};
  const rows = await query<{ id: number }>(
    `insert into sponsors (name, blurb, logo_url, website_url, sort_order, published)
     values ($1,$2,$3,$4,$5,$6) returning id`,
    [
      String(b.name || "Sponsor").trim(),
      String(b.blurb || "").trim(),
      b.logo_url || null,
      b.website_url || null,
      Number(b.sort_order ?? 0),
      b.published !== false,
    ],
  );
  res.json({ ok: true, id: rows[0]?.id });
});

app.put("/api/admin/sponsors/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const cur = await query(`select * from sponsors where id = $1`, [id]);
  if (!cur[0]) return res.status(404).json({ error: "Not found" });
  const row = cur[0] as Record<string, unknown>;
  await query(
    `update sponsors set
      name=$1, blurb=$2, logo_url=$3, website_url=$4,
      sort_order=$5, published=$6, updated_at=now()
     where id=$7`,
    [
      b.name !== undefined ? b.name : row.name,
      b.blurb !== undefined ? b.blurb : row.blurb,
      b.logo_url !== undefined ? b.logo_url : row.logo_url,
      b.website_url !== undefined ? b.website_url : row.website_url,
      b.sort_order !== undefined ? b.sort_order : row.sort_order,
      b.published !== undefined ? b.published : row.published,
      id,
    ],
  );
  res.json({ ok: true });
});

app.delete("/api/admin/sponsors/:id", requireAdmin, async (req, res) => {
  await query(`delete from sponsors where id = $1`, [Number(req.params.id)]);
  res.json({ ok: true });
});

// ─── Admin: settings & admins ─────────────────────────────────────────────

app.get("/api/admin/settings", requireAdmin, async (_req, res) => {
  const rows = await query<{ key: string; value: string }>(
    `select key, value from club_settings`,
  );
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json({
    homepage_template: map.homepage_template || "carousel",
    homepage_headline: map.homepage_headline || "Pensacola Aviators",
    homepage_subhead:
      map.homepage_subhead || "Hard-running club rugby on the Gulf Coast.",
    homepage_cta_label: map.homepage_cta_label || "Join the club",
    motto: map.motto || "Fly the pitch",
    practice_days: map.practice_days || "Tuesdays & Thursdays",
    practice_time: map.practice_time || "6:00 – 8:00 PM",
    practice_note: map.practice_note || "Open training — first-timers welcome",
    pitch_address: map.pitch_address || "555 E Nine Mile Rd",
    pitch_city: map.pitch_city || "Pensacola, FL",
    pitch_maps_url: map.pitch_maps_url || "",
    instagram_url: map.instagram_url || "https://www.instagram.com/pensacola_rugby/",
    facebook_url: map.facebook_url || "https://www.facebook.com/pensacolarugby/",
    about_body: map.about_body || "",
    practice_body: map.practice_body || "",
    join_body: map.join_body || "",
    sponsor_blurb: map.sponsor_blurb || "Thanks to the businesses that keep the club flying.",
    duration: map.duration || "2 hours",
    first_session: map.first_session || "Free",
    sponsor_name: map.sponsor_name || "Local partners",
    stats: map.stats || '[{"value":"Est.","label":"Gulf Coast club"},{"value":"2×","label":"Weekly training"},{"value":"15s","label":"& Sevens"},{"value":"Open","label":"Always recruiting"}]',
    values: map.values || '[{"title":"Pack","body":"We train together, compete together, and lift each other after the whistle."},{"title":"Grit","body":"Fitness, collisions, and second effort — that\'s the Aviator way."},{"title":"Community","body":"From first-timers to veterans, everyone has a role in the club."}]',
    teams: map.teams || '[{"name":"Aviators","side":"Men\'s","description":"Men\'s club side competing in fifteens seasons and sevens weekends across the Southeast."},{"name":"Aviatrix","side":"Women\'s","description":"Women\'s club side — skill development, competition, and a strong club culture."}]',
    join_steps: map.join_steps || '[{"step":"01","title":"Show up to practice","body":"Tuesdays and Thursdays at 6 PM. No tryout — just introduce yourself."},{"step":"02","title":"Train with the squad","body":"Learn the game, build fitness, and earn your spot in the pack or backline."},{"step":"03","title":"Play for Pensacola","body":"Represent the Aviators or Aviatrix in season games and sevens weekends."}]',
  });
});

app.put("/api/admin/settings", requireAdmin, async (req, res) => {
  const b = req.body || {};
  const keys: string[] = [
    "homepage_template", "homepage_headline", "homepage_subhead", "homepage_cta_label",
    "motto", "practice_days", "practice_time", "practice_note",
    "pitch_address", "pitch_city", "pitch_maps_url",
    "instagram_url", "facebook_url",
    "about_body", "practice_body", "join_body",
    "sponsor_blurb", "sponsor_name",
    "duration", "first_session",
    "stats", "values", "teams", "join_steps",
  ];
  const pairs: [string, string][] = keys.map((k) => [k, String(b[k] ?? "")]);
  for (const [key, value] of pairs) {
    await query(
      `insert into club_settings (key, value) values ($1,$2)
       on conflict (key) do update set value = excluded.value`,
      [key, value],
    );
  }
  await refreshSettings();
  res.json({ ok: true });
});

app.get("/api/admin/admins", requireAdmin, async (_req, res) => {
  const rows = await query(
    `select id, email, name, role, created_at from admin_users order by created_at`,
  );
  res.json(rows);
});

app.post("/api/admin/admins", requireAdmin, async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const name = String(req.body?.name || "").trim() || null;
  const password = String(req.body?.password || "aviators");
  if (!email.includes("@")) return res.status(400).json({ error: "Valid email required" });
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash(password, 10);
  await query(
    `insert into admin_users (email, name, password_hash, role)
     values ($1,$2,$3,'admin')
     on conflict (email) do update set name = coalesce(excluded.name, admin_users.name)`,
    [email, name, hash],
  );
  res.json({ ok: true });
});

app.delete("/api/admin/admins/:id", requireAdmin, async (req, res) => {
  const count = await query<{ n: number }>(
    `select count(*)::int as n from admin_users`,
  );
  if ((count[0]?.n ?? 0) <= 1)
    return res.status(400).json({ error: "Cannot remove the last admin" });
  await query(`delete from admin_users where id = $1`, [Number(req.params.id)]);
  res.json({ ok: true });
});

app.put("/api/admin/admins/:id/password", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (id !== req.session.admin?.id) {
    return res.status(403).json({ error: "You can only change your own password" });
  }
  const newPassword = String(req.body?.password || "");
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  await updateAdminPassword(id, newPassword);
  // If the admin changed their own password and it was the default, clear the flag
  res.json({ ok: true });
});

// Production: serve built frontend
if (isProd) {
  const dist = path.join(__dirname, "..", "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

async function boot() {
  try {
    await ensureSeedAdmin();
  } catch (err) {
    console.error("[boot] seed admin failed (is DATABASE_URL set?):", err);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[api] listening on http://0.0.0.0:${PORT}`);
  });
}

boot();
