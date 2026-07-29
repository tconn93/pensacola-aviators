import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  api,
  type Admin,
  type AdminRow,
  type Inquiry,
  type Match,
  type Media,
  type SiteSettings,
} from "@/lib/api";

type Tab = "messages" | "schedule" | "media" | "site" | "admins";

export function AdminPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>("messages");

  useEffect(() => {
    api
      .me()
      .then((r) => setAdmin(r.admin))
      .catch(() => navigate("/login"))
      .finally(() => setChecking(false));
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

  async function addMatch(e: FormEvent) {
    e.preventDefault();
    await api.createMatch({
      ...form,
      our_score: form.our_score === "" ? null : Number(form.our_score),
      their_score: form.their_score === "" ? null : Number(form.their_score),
    } as Partial<Match>);
    setForm((f) => ({ ...f, opponent: "", notes: "" }));
    await load();
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
      <form onSubmit={addMatch} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 grid gap-3 sm:grid-cols-2">
        <h2 className="heading-md sm:col-span-2">Add match</h2>
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
        <button type="submit" className="btn btn-primary sm:col-span-2">Add match</button>
      </form>
      <ul className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {matches.map((m) => (
          <li key={m.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <div>
              <div className="font-medium text-sm">vs {m.opponent}</div>
              <div className="text-xs text-[var(--color-muted)]">
                {m.match_date} · {m.status} · {m.location}
                {m.status === "final" && m.our_score != null
                  ? ` · ${m.our_score}–${m.their_score}`
                  : ""}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm text-[var(--color-primary)]"
              onClick={() => {
                if (confirm("Delete match?")) void api.deleteMatch(m.id).then(load);
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MediaPanel() {
  const [items, setItems] = useState<Media[]>([]);

  const load = useCallback(async () => {
    setItems(await api.media());
  }, []);

  useEffect(() => {
    void load().catch(console.error);
  }, [load]);

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
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
        show_in_gallery: true,
        show_on_home: false,
        published: true,
      });
    }
    await load();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="heading-lg !text-3xl">Photos</h1>
          <p className="text-sm text-[var(--color-muted)] mt-2">
            Upload images and toggle Homepage / Gallery / Published.
          </p>
        </div>
        <label className="btn btn-primary cursor-pointer">
          Upload
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              void onUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  onClick={() =>
                    void api.patchMedia(m.id, { show_on_home: !m.show_on_home }).then(load)
                  }
                />
                <Toggle
                  label="Gallery"
                  active={m.show_in_gallery}
                  onClick={() =>
                    void api
                      .patchMedia(m.id, { show_in_gallery: !m.show_in_gallery })
                      .then(load)
                  }
                />
                <Toggle
                  label={m.published ? "Live" : "Draft"}
                  active={m.published}
                  onClick={() =>
                    void api.patchMedia(m.id, { published: !m.published }).then(load)
                  }
                />
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-[var(--color-primary)]"
                onClick={() => {
                  if (confirm("Delete image?")) void api.deleteMedia(m.id).then(load);
                }}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
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

  if (!form) return <p className="text-sm text-[var(--color-muted)]">Loading…</p>;

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="heading-lg !text-3xl mb-2">Homepage layout</h1>
      <label className="block text-sm">
        Template
        <select
          className="field mt-1"
          value={form.homepage_template}
          onChange={(e) => setForm({ ...form, homepage_template: e.target.value })}
        >
          <option value="carousel">Carousel</option>
          <option value="static">Static</option>
          <option value="split">Split</option>
          <option value="collage">Collage</option>
        </select>
      </label>
      <label className="block text-sm">
        Headline
        <input
          className="field mt-1"
          value={form.homepage_headline}
          onChange={(e) => setForm({ ...form, homepage_headline: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        Subhead
        <textarea
          className="field mt-1"
          rows={3}
          value={form.homepage_subhead}
          onChange={(e) => setForm({ ...form, homepage_subhead: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        CTA label
        <input
          className="field mt-1"
          value={form.homepage_cta_label}
          onChange={(e) => setForm({ ...form, homepage_cta_label: e.target.value })}
        />
      </label>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() =>
          void api.saveSettings(form).then(() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          })
        }
      >
        {saved ? "Saved" : "Save settings"}
      </button>
    </div>
  );
}

function AdminsPanel({ currentEmail }: { currentEmail: string }) {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("changeme");

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
      <ul className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {admins.map((a) => (
          <li key={a.id} className="px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-sm">
                {a.name || a.email}
                {a.email === currentEmail && (
                  <span className="ml-2 text-xs text-[var(--color-primary)]">(you)</span>
                )}
              </div>
              <div className="text-xs text-[var(--color-muted)]">{a.email} · {a.role}</div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm text-[var(--color-primary)]"
              disabled={admins.length <= 1}
              onClick={() => {
                if (confirm(`Remove ${a.email}?`)) void api.removeAdmin(a.id).then(load);
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
