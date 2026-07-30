import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  api,
  type Admin,
  type AdminRow,
  type Inquiry,
  type Match,
  type Media,
  type SiteSettings,
  type Sponsor,
  type SponsorInput,
} from "@/lib/api";
import { JsonArrayEditor, type JsonArrayField } from "@/components/JsonArrayEditor";

type Tab = "messages" | "schedule" | "media" | "site" | "sponsors" | "admins";

export function AdminPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>("messages");
  const [forcePasswordOpen, setForcePasswordOpen] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((r) => {
        setAdmin(r.admin);
        if (r.admin.needsPasswordChange) setForcePasswordOpen(true);
      })
      .catch(() => navigate("/login"))
      .finally(() => setChecking(false));
    // Check for ?tab= query param
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t && ["messages", "schedule", "media", "site", "sponsors", "admins"].includes(t)) {
      setTab(t as Tab);
    }
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-dvh grid place-items-center text-[var(--color-muted)] text-sm">
        Checking session…
      </div>
    );
  }
  if (!admin) return null;

  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      {forcePasswordOpen && (
        <ForcePasswordChange
          admin={admin}
          onDone={() => {
            setForcePasswordOpen(false);
            setAdmin((a) => a ? { ...a, needsPasswordChange: false } : a);
          }}
        />
      )}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] sticky top-0 z-20">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <div>
            <div className="font-[family-name:var(--font-display)] text-sm tracking-wide uppercase">
              Aviators Admin
            </div>
            <div className="text-xs text-[var(--color-muted)]">{admin.email}</div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]">
              Public site
            </Link>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={async () => {
                await api.logout();
                navigate("/login");
              }}
            >
              Sign out
            </button>
          </div>
        </div>
        <div className="container-x overflow-x-auto">
          <nav className="flex gap-1 -mb-px min-w-max">
            {(
              [
                ["messages", "Messages"],
                ["schedule", "Schedule"],
                ["media", "Media"],
                ["site", "Homepage"],
                ["sponsors", "Sponsors"],
                ["admins", "Admins"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  tab === key
                    ? "border-[var(--color-primary)] text-[var(--color-fg)]"
                    : "border-transparent text-[var(--color-muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <div className="container-x py-6 md:py-8">
        {tab === "messages" && <MessagesPanel />}
        {tab === "schedule" && <SchedulePanel />}
        {tab === "media" && <MediaPanel />}
        {tab === "site" && <SitePanel />}
        {tab === "sponsors" && <SponsorsPanel />}
        {tab === "admins" && <AdminsPanel currentEmail={admin.email} />}
      </div>
    </div>
  );
}

function MessagesPanel() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await api.inquiries());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <h1 className="heading-lg !text-3xl mb-6">Website messages</h1>
      {error && <p className="text-sm text-[var(--color-primary)] mb-4">{error}</p>}
      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">No messages yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-[var(--color-muted)]">{item.contact}</div>
                </div>
                <span className="text-xs uppercase tracking-wide text-[var(--color-subtle)]">
                  {item.status}
                </span>
              </div>
              <p className="text-sm text-[var(--color-muted)] mb-3 whitespace-pre-wrap">
                {item.note || "No note"}
              </p>
              <div className="flex flex-wrap gap-2">
                {(["read", "contacted", "archived"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => void api.updateInquiry(item.id, s).then(load)}
                  >
                    {s}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-[var(--color-primary)]"
                  onClick={() => {
                    if (confirm("Delete message?"))
                      void api.deleteInquiry(item.id).then(load);
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SchedulePanel() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [season, setSeason] = useState("Fall 2026");
  const [matches, setMatches] = useState<Match[]>([]);
  const [form, setForm] = useState({
    season: "Fall 2026",
    team: "aviators",
    opponent: "",
    match_date: new Date().toISOString().slice(0, 10),
    kickoff_time: "2:00 PM",
    location: "home",
    venue: "555 E Nine Mile Rd",
    status: "scheduled",
    our_score: "",
    their_score: "",
    notes: "",
    published: true,
    is_matrix: false,
  });

  const load = useCallback(async () => {
    const data = await api.matches();
    setSeason(data.currentSeason);
    setMatches(data.matches);
    setForm((f) => ({ ...f, season: data.currentSeason }));
  }, []);

  useEffect(() => {
    void load().catch(console.error);
  }, [load]);

  async function saveSeason() {
    await api.setSeason(season);
    await load();
  }

  async function saveMatch(e: FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      our_score: form.our_score === "" ? null : Number(form.our_score),
      their_score: form.their_score === "" ? null : Number(form.their_score),
    };
    if (editingId) {
      await api.updateMatch(editingId, payload as Partial<Match>);
    } else {
      await api.createMatch(payload as Partial<Match>);
    }
    setEditingId(null);
    setShowForm(false);
    setForm((f) => ({ ...f, opponent: "", notes: "" }));
    await load();
  }

  function editMatch(m: Match) {
    setForm({
      season: m.season,
      team: m.team,
      opponent: m.opponent,
      match_date: m.match_date,
      kickoff_time: m.kickoff_time || "2:00 PM",
      location: m.location,
      venue: m.venue || "555 E Nine Mile Rd",
      status: m.status,
      our_score: m.our_score?.toString() || "",
      their_score: m.their_score?.toString() || "",
      notes: m.notes || "",
      published: m.published,
      is_matrix: m.is_matrix,
    });
    setEditingId(m.id);
    setShowForm(true);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-lg !text-3xl mb-2">Schedule & results</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Publish fixtures and final scores for the public site.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <label className="block flex-1 text-sm">
          Current season
          <input
            className="field mt-1"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
          />
        </label>
        <button type="button" className="btn btn-primary" onClick={() => void saveSeason()}>
          Save season
        </button>
      </div>
      {showForm ? (
        <form onSubmit={saveMatch} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 flex items-center justify-between">
            <h2 className="heading-md">{editingId ? "Edit match" : "Add match"}</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
          </div>
          <input className="field" placeholder="Opponent" value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} required />
          <input className="field" type="date" value={form.match_date} onChange={(e) => setForm({ ...form, match_date: e.target.value })} required />
        <select className="field" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })}>
          <option value="aviators">Aviators</option>
          <option value="aviatrix">Aviatrix</option>
          <option value="both">Both</option>
        </select>
        <select className="field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
          <option value="home">Home</option>
          <option value="away">Away</option>
          <option value="neutral">Neutral</option>
          <option value="tourney">Tourney</option>
        </select>
        <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="scheduled">Scheduled</option>
          <option value="final">Final</option>
          <option value="postponed">Postponed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input className="field" placeholder="Kickoff" value={form.kickoff_time} onChange={(e) => setForm({ ...form, kickoff_time: e.target.value })} />
        <input className="field" placeholder="Us score" value={form.our_score} onChange={(e) => setForm({ ...form, our_score: e.target.value })} />
        <input className="field" placeholder="Them score" value={form.their_score} onChange={(e) => setForm({ ...form, their_score: e.target.value })} />
        <label className="sm:col-span-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_matrix} onChange={(e) => setForm({ ...form, is_matrix: e.target.checked })} />
          Matrix match
        </label>
        <button type="submit" className="btn btn-primary sm:col-span-2">{editingId ? "Update match" : "Add match"}</button>
      </form>
      ) : (
        <button type="button" className="btn btn-outline" onClick={() => setShowForm(true)}>Add match</button>
      )}
      <ul className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {matches.map((m) => (
          <li key={m.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <div>
              <div className="font-medium text-sm">{m.location === "tourney" ? m.opponent : `vs ${m.opponent}`}
                {m.is_matrix && <span className="ml-2 text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--color-accent)] border border-[var(--color-accent)]/30 px-1.5 py-0.5 rounded">Matrix</span>}
              </div>
              <div className="text-xs text-[var(--color-muted)]">
                {m.match_date.split("T")[0].split("-").reverse().join("/")} · {m.kickoff_time || "TBD"} · {m.status} · {m.location}
                {m.status === "final" && m.our_score != null
                  ? ` · ${m.our_score}–${m.their_score}`
                  : ""}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => editMatch(m)}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-[var(--color-primary)]"
                onClick={() => {
                  if (confirm("Delete match?")) void api.deleteMatch(m.id).then(load);
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MediaPanel() {
  const [items, setItems] = useState<Media[]>([]);
  const [albumList, setAlbumList] = useState<{ id: number; name: string; image_count: number }[]>([]);
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [pendingCaption, setPendingCaption] = useState("");

  const load = useCallback(async () => {
    setItems(await api.media());
    setAlbumList(await api.albums());
  }, []);

  useEffect(() => {
    void load().catch(console.error);
  }, [load]);

  async function onUpload(files: FileList | null, albumId?: number) {
    if (!files?.length) return;
    const caption = pendingCaption.trim() || null;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") || file.size > 1_200_000) continue;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error("read failed"));
        r.readAsDataURL(file);
      });
      await api.uploadMedia({
        dataUrl,
        title: file.name.replace(/\.[^.]+$/, ""),
        alt: file.name,
        caption,
        show_in_gallery: true,
        show_on_home: false,
        published: true,
        album_id: albumId,
      });
    }
    setPendingCaption("");
    await load();
  }

  async function onCreateAlbum() {
    const name = newAlbumName.trim();
    if (!name) return;
    await api.createAlbum({ name });
    setNewAlbumName("");
    setShowNewAlbum(false);
    await load();
  }

  return (
    <div className="space-y-8">
      {/* ── Albums section ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="heading-md">Albums</h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowNewAlbum(!showNewAlbum)}>
            {showNewAlbum ? "Cancel" : "New album"}
          </button>
        </div>

        {showNewAlbum && (
          <div className="flex gap-2 mb-4 max-w-sm">
            <input
              className="field flex-1"
              placeholder="Album name"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void onCreateAlbum(); }}
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void onCreateAlbum()}>Create</button>
          </div>
        )}

        {albumList.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] mb-4">No albums yet.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-3 mb-4">
            {albumList.map((a) => (
              <div key={a.id} className="shrink-0 w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-card">
                <Link to={`/gallery/${a.id}?edit=true`} className="font-medium text-sm truncate block hover:text-[var(--color-primary)]">{a.name}</Link>
                <div className="text-xs text-[var(--color-subtle)]">{a.image_count} photo(s)</div>
                <label className="btn btn-outline btn-sm mt-2 cursor-pointer inline-flex">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => { void onUpload(e.target.files, a.id); e.target.value = ""; }}
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── All photos ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
          <h2 className="heading-md">All photos</h2>
          <div className="flex items-center gap-3">
            <input className="field text-xs py-1 w-48" placeholder="Caption (optional)" value={pendingCaption} onChange={(e) => setPendingCaption(e.target.value)} />
            <label className="btn btn-primary cursor-pointer">
              Upload photos
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => { void onUpload(e.target.files); e.target.value = ""; }}
              />
            </label>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 && <p className="text-sm text-[var(--color-muted)] sm:col-span-3">No photos yet.</p>}
          {items.map((m) => (
            <article key={m.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
              <div className="aspect-[4/3] bg-[var(--color-bg-elevated)]">
                {m.url && <img src={m.url} alt={m.alt} className="h-full w-full object-cover" />}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Toggle
                    label="Home"
                    active={m.show_on_home}
                    onClick={() => void api.patchMedia(m.id, { show_on_home: !m.show_on_home }).then(load)}
                  />
                  <Toggle
                    label="Gallery"
                    active={m.show_in_gallery}
                    onClick={() => void api.patchMedia(m.id, { show_in_gallery: !m.show_in_gallery }).then(load)}
                  />
                </div>
                <input
                  className="field text-xs py-1 h-8"
                  placeholder="Caption"
                  value={m.caption || ""}
                  onChange={(e) => {
                    void api.patchMedia(m.id, { caption: e.target.value || null }).then(load);
                  }}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-[var(--color-primary)]"
                  onClick={() => { if (confirm("Delete image?")) void api.deleteMedia(m.id).then(load); }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded-full border px-2.5 text-[0.7rem] font-medium ${
        active
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/15"
          : "border-[var(--color-border)] text-[var(--color-muted)]"
      }`}
    >
      {label}
    </button>
  );
}

function SitePanel() {
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.settings().then(setForm).catch(console.error);
  }, []);

  function set<K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  if (!form) return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;

  async function save() {
    if (!form) return;
    await api.saveSettings(form).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const statFields: JsonArrayField[] = [
    { key: "value", label: "Value" },
    { key: "label", label: "Label" },
  ];
  const valueFields: JsonArrayField[] = [
    { key: "title", label: "Title" },
    { key: "body", label: "Body", type: "textarea" },
  ];
  const teamFields: JsonArrayField[] = [
    { key: "name", label: "Name" },
    { key: "side", label: "Side (Men's / Women's)" },
    { key: "description", label: "Description", type: "textarea" },
  ];
  const stepFields: JsonArrayField[] = [
    { key: "step", label: "Step number" },
    { key: "title", label: "Title" },
    { key: "body", label: "Body", type: "textarea" },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="heading-lg !text-3xl mb-2">Homepage content</h1>
      <p className="text-sm text-[var(--color-muted)]">
        Edit every piece of text that appears on the public site.
      </p>

      {/* ── Layout ── */}
      <fieldset className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <legend className="heading-md px-1">Layout</legend>
        <label className="block text-sm">Template
          <select className="field mt-1" value={form.homepage_template} onChange={(e) => set("homepage_template", e.target.value)}>
            <option value="carousel">Carousel</option>
            <option value="static">Static</option>
            <option value="split">Split</option>
            <option value="collage">Collage</option>
          </select>
        </label>
        <label className="block text-sm">Headline
          <input className="field mt-1" value={form.homepage_headline} onChange={(e) => set("homepage_headline", e.target.value)} />
        </label>
        <label className="block text-sm">Subhead
          <textarea className="field mt-1" rows={3} value={form.homepage_subhead} onChange={(e) => set("homepage_subhead", e.target.value)} />
        </label>
        <label className="block text-sm">CTA button label
          <input className="field mt-1" value={form.homepage_cta_label} onChange={(e) => set("homepage_cta_label", e.target.value)} />
        </label>
      </fieldset>

      {/* ── Hero ── */}
      <fieldset className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <legend className="heading-md px-1">Hero</legend>
        <label className="block text-sm">Motto
          <input className="field mt-1" value={form.motto} onChange={(e) => set("motto", e.target.value)} />
        </label>
      </fieldset>

      {/* ── Stats ── */}
      <fieldset className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <legend className="heading-md px-1">Stats Bar</legend>
        <JsonArrayEditor
          label="Stat items"
          value={form.stats}
          onChange={(v) => set("stats", v)}
          fields={statFields}
        />
      </fieldset>

      {/* ── About ── */}
      <fieldset className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <legend className="heading-md px-1">About Section</legend>
        <label className="block text-sm">About body text
          <textarea className="field mt-1" rows={4} value={form.about_body} onChange={(e) => set("about_body", e.target.value)} />
        </label>
        <div className="border-t border-[var(--color-border)] pt-3">
          <JsonArrayEditor
            label="Values"
            value={form.values}
            onChange={(v) => set("values", v)}
            fields={valueFields}
          />
        </div>
        <div className="border-t border-[var(--color-border)] pt-3">
          <JsonArrayEditor
            label="Teams"
            value={form.teams}
            onChange={(v) => set("teams", v)}
            fields={teamFields}
          />
        </div>
      </fieldset>

      {/* ── Practice ── */}
      <fieldset className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <legend className="heading-md px-1">Practice &amp; Pitch</legend>
        <label className="block text-sm">Practice days
          <input className="field mt-1" value={form.practice_days} onChange={(e) => set("practice_days", e.target.value)} />
        </label>
        <label className="block text-sm">Practice time
          <input className="field mt-1" value={form.practice_time} onChange={(e) => set("practice_time", e.target.value)} />
        </label>
        <label className="block text-sm">Practice note
          <input className="field mt-1" value={form.practice_note} onChange={(e) => set("practice_note", e.target.value)} />
        </label>
        <label className="block text-sm">Practice section body
          <textarea className="field mt-1" rows={3} value={form.practice_body} onChange={(e) => set("practice_body", e.target.value)} />
        </label>
        <label className="block text-sm">Pitch address
          <input className="field mt-1" value={form.pitch_address} onChange={(e) => set("pitch_address", e.target.value)} />
        </label>
        <label className="block text-sm">Pitch city
          <input className="field mt-1" value={form.pitch_city} onChange={(e) => set("pitch_city", e.target.value)} />
        </label>
        <label className="block text-sm">Maps URL
          <input className="field mt-1" value={form.pitch_maps_url} onChange={(e) => set("pitch_maps_url", e.target.value)} />
        </label>
        <label className="block text-sm">Duration display
          <input className="field mt-1" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
        </label>
        <label className="block text-sm">First session display
          <input className="field mt-1" value={form.first_session} onChange={(e) => set("first_session", e.target.value)} />
        </label>
      </fieldset>

      {/* ── Socials ── */}
      <fieldset className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <legend className="heading-md px-1">Social Links</legend>
        <label className="block text-sm">Instagram URL
          <input className="field mt-1" value={form.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} />
        </label>
        <label className="block text-sm">Facebook URL
          <input className="field mt-1" value={form.facebook_url} onChange={(e) => set("facebook_url", e.target.value)} />
        </label>
      </fieldset>

      {/* ── Join ── */}
      <fieldset className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <legend className="heading-md px-1">Join Section</legend>
        <label className="block text-sm">Join body text
          <textarea className="field mt-1" rows={3} value={form.join_body} onChange={(e) => set("join_body", e.target.value)} />
        </label>
        <div className="border-t border-[var(--color-border)] pt-3">
          <JsonArrayEditor
            label="Join steps"
            value={form.join_steps}
            onChange={(v) => set("join_steps", v)}
            fields={stepFields}
          />
        </div>
      </fieldset>

      {/* ── Sponsors (legacy) ── */}
      <fieldset className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <legend className="heading-md px-1">Sponsors (legacy text)</legend>
        <p className="text-xs text-[var(--color-muted)]">These fields are for the old text-only sponsor display. New sponsors are managed in the Sponsors tab.</p>
        <label className="block text-sm">Sponsor name
          <input className="field mt-1" value={form.sponsor_name} onChange={(e) => set("sponsor_name", e.target.value)} />
        </label>
        <label className="block text-sm">Sponsor blurb
          <input className="field mt-1" value={form.sponsor_blurb} onChange={(e) => set("sponsor_blurb", e.target.value)} />
        </label>
      </fieldset>

      {/* ── Footer ── */}
      <fieldset className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <legend className="heading-md px-1">Footer</legend>
        <p className="text-xs text-[var(--color-muted)]">Text shown in the site footer across every page.</p>
        <label className="block text-sm">Club name
          <input className="field mt-1" value={form.club_name} onChange={(e) => set("club_name", e.target.value)} />
        </label>
        <label className="block text-sm">Tagline
          <input className="field mt-1" value={form.footer_tagline} onChange={(e) => set("footer_tagline", e.target.value)} />
        </label>
      </fieldset>

      <button type="button" className="btn btn-primary" onClick={() => void save()}>
        {saved ? "Saved" : "Save settings"}
      </button>
    </div>
  );
}

function AdminsPanel({ currentEmail }: { currentEmail: string }) {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("aviators");
  const [changePwId, setChangePwId] = useState(-1);
  const [changePwVal, setChangePwVal] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const load = useCallback(async () => {
    setAdmins(await api.admins());
  }, []);

  useEffect(() => {
    void load().catch(console.error);
  }, [load]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    await api.addAdmin({ email, name: name || undefined, password });
    setEmail("");
    setName("");
    await load();
  }

  async function onChangePw(id: number) {
    if (changePwVal.length < 6) { setPwMsg("Min 6 characters"); return; }
    await api.updatePassword(id, changePwVal);
    setChangePwId(-1);
    setChangePwVal("");
    setPwMsg("Password updated");
    setTimeout(() => setPwMsg(""), 3000);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="heading-lg !text-3xl">Admin users</h1>
        <p className="text-sm text-[var(--color-muted)] mt-2">
          People listed here can sign in and manage the club site.
        </p>
      </div>
      <form onSubmit={onAdd} className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <input className="field" type="email" placeholder="coach@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="field" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="field" type="password" placeholder="Temp password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="btn btn-primary">Add admin</button>
      </form>
      {pwMsg && <p className="text-sm text-[var(--color-primary)]">{pwMsg}</p>}
      <ul className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {admins.map((a) => (
          <li key={a.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <div className="font-medium text-sm">
                  {a.name || a.email}
                  {a.email === currentEmail && (
                    <span className="ml-2 text-xs text-[var(--color-primary)]">(you)</span>
                  )}
                </div>
                <div className="text-xs text-[var(--color-muted)]">{a.email} &middot; {a.role}</div>
              </div>
              <div className="flex gap-2">
                {a.email === currentEmail && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setChangePwId(changePwId === a.id ? -1 : a.id)}
                  >
                    {changePwId === a.id ? "Cancel" : "Change password"}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-[var(--color-primary)]"
                  disabled={admins.length <= 1}
                  onClick={() => {
                    if (confirm("Remove " + a.email + "?")) void api.removeAdmin(a.id).then(load);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
            {changePwId === a.id && (
              <div className="flex gap-2 items-center pt-2 border-t border-[var(--color-border)]">
                <input
                  className="field flex-1"
                  type="password"
                  placeholder="New password (min 6 chars)"
                  value={changePwVal}
                  onChange={(e) => setChangePwVal(e.target.value)}
                  autoFocus
                />
                <button type="button" className="btn btn-primary btn-sm" onClick={() => void onChangePw(a.id)}>
                  Save
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SponsorsPanel() {
  const [items, setItems] = useState<Sponsor[]>([]);
  const [form, setForm] = useState<SponsorInput>({
    name: "", blurb: "", logo_url: "", website_url: "", sort_order: 0, published: true,
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setItems(await api.sponsors());
  }, []);

  useEffect(() => { void load().catch(console.error); }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      await api.updateSponsor(editingId, form);
    } else {
      await api.createSponsor(form);
    }
    setForm({ name: "", blurb: "", logo_url: "", website_url: "", sort_order: 0, published: true });
    setEditingId(null);
    await load();
  }

  function edit(s: Sponsor) {
    setForm({ name: s.name, blurb: s.blurb, logo_url: s.logo_url ?? "", logoDataUrl: undefined, logoMime: undefined, website_url: s.website_url ?? "", sort_order: s.sort_order, published: s.published });
    setEditingId(s.id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-lg !text-3xl mb-2">Sponsors</h1>
        <p className="text-sm text-[var(--color-muted)]">Manage sponsor logos, blurbs, and website links.</p>
      </div>
      <form onSubmit={save} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 grid gap-3 sm:grid-cols-2">
        <h2 className="heading-md sm:col-span-2">{editingId ? "Edit sponsor" : "Add sponsor"}</h2>
        <input className="field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="field" type="number" placeholder="Sort order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
        <textarea className="field sm:col-span-2" rows={2} placeholder="Blurb" value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value })} />
        <label className="sm:col-span-2 text-sm flex items-center gap-3">
          <span>Logo image:</span>
          <input type="file" accept="image/*" className="text-xs" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const r = new FileReader();
              r.onload = () => resolve(String(r.result));
              r.onerror = () => reject(new Error("read failed"));
              r.readAsDataURL(file);
            });
            setForm({ ...form, logoDataUrl: dataUrl, logoMime: file.type });
          }} />
        </label>
        {form.logo_url && !form.logoDataUrl && (
          <p className="text-xs text-[var(--color-muted)] sm:col-span-2">Current logo: {form.logo_url.slice(0, 60)}...</p>
        )}
        <input className="field" placeholder="Logo URL (external link)" value={form.logo_url ?? ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value, logoDataUrl: undefined })} />
        <input className="field" placeholder="Website URL" value={form.website_url ?? ""} onChange={(e) => setForm({ ...form, website_url: e.target.value })} />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
          Published
        </label>
        <div className="sm:col-span-2 flex gap-2">
          <button type="submit" className="btn btn-primary">{editingId ? "Update" : "Add sponsor"}</button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={() => {
              setForm({ name: "", blurb: "", logo_url: "", website_url: "", sort_order: 0, published: true });
              setEditingId(null);
            }}>Cancel</button>
          )}
        </div>
      </form>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <article key={s.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-card">
            {s.logo_url && (
              <div className="aspect-[3/1] bg-[var(--color-bg-elevated)] rounded-xl mb-3 flex items-center justify-center p-3">
                <img src={s.logo_url} alt={s.name} className="max-h-full max-w-full object-contain" />
              </div>
            )}
            <h3 className="font-medium text-sm">{s.name}</h3>
            {s.blurb && <p className="text-xs text-[var(--color-muted)] mt-1">{s.blurb}</p>}
            {s.website_url && (
              <a href={s.website_url} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-primary)] block mt-1 truncate">{s.website_url}</a>
            )}
            <div className="flex gap-2 mt-3">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => edit(s)}>Edit</button>
              <button type="button" className="btn btn-ghost btn-sm text-[var(--color-primary)]" onClick={() => {
                if (confirm("Delete sponsor?")) void api.deleteSponsor(s.id).then(load);
              }}>Delete</button>
            </div>
          </article>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-[var(--color-muted)] sm:col-span-3">No sponsors yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}

function ForcePasswordChange({ admin, onDone }: { admin: Admin; onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (pw.length < 6) { setError("Min 6 characters"); return; }
    if (pw !== pw2) { setError("Passwords don't match"); return; }
    setBusy(true);
    try {
      await api.updatePassword(admin.id, pw);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--color-bg)]/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-card">
        <h2 className="heading-lg !text-xl mb-2">Change your password</h2>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          Your password is still set to the default. Choose a new one to continue.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">New password
            <input className="field mt-1.5" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} autoFocus />
          </label>
          <label className="block text-sm">Confirm password
            <input className="field mt-1.5" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
          </label>
          {error && <p className="text-sm text-[var(--color-primary)]">{error}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Saving..." : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}
