import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Shield,
  Users,
} from "lucide-react";
import { club } from "@/data/club";
import { api, type Match, type Media, type SitePayload } from "@/lib/api";

export function HomePage() {
  const [site, setSite] = useState<SitePayload | null>(null);

  useEffect(() => {
    api.site().then(setSite).catch(() => setSite(null));
  }, []);

  return (
    <main id="top">
      <Hero site={site} />
      <StatsBar />
      <About />
      <Practice />
      <Schedule site={site} />
      <Gallery site={site} />
      <Sponsors />
      <Join />
    </main>
  );
}

function Hero({ site }: { site: SitePayload | null }) {
  const [slide, setSlide] = useState(0);
  const images = site?.homeImages?.length
    ? site.homeImages
    : ([] as Media[]);
  const template = site?.presentation.homepage_template || "carousel";
  const headline = site?.presentation.homepage_headline || "Pensacola Aviators";
  const subhead =
    site?.presentation.homepage_subhead ||
    "Hard-running club rugby on the Gulf Coast. Train with the Aviators and Aviatrix every week — first-timers welcome, no experience required.";
  const cta = site?.presentation.homepage_cta_label || "Join the club";

  useEffect(() => {
    if (template !== "carousel" || images.length <= 1) return;
    const id = window.setInterval(
      () => setSlide((s) => (s + 1) % images.length),
      5500,
    );
    return () => window.clearInterval(id);
  }, [template, images.length]);

  const parts = headline.split(/\s+/);
  const last = parts.length > 1 ? parts.pop()! : "";
  const first = parts.join(" ");

  return (
    <section className="relative min-h-[100dvh] flex items-end overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-pitch)]">
        {images.map((img, i) => (
          <img
            key={img.id}
            src={img.url}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              template === "static"
                ? i === 0
                  ? "opacity-100"
                  : "opacity-0"
                : i === slide
                  ? "opacity-100"
                  : "opacity-0"
            }`}
          />
        ))}
        {!images.length && (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-pitch)] via-[var(--color-bg)] to-[var(--color-bg-elevated)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/80 to-[var(--color-bg)]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg)]/90 via-[var(--color-bg)]/50 to-transparent" />
        <div className="absolute inset-0 grain opacity-40" />
      </div>

      <div className="relative container-x w-full pb-16 pt-28 md:pb-24 md:pt-36">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)]/70 bg-[var(--color-bg)]/50 px-3 py-1.5 mb-6 backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-[var(--color-primary)]" />
            <span className="text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
              Pensacola · Always recruiting
            </span>
          </div>
          <p className="eyebrow mb-2">Rugby Football Club</p>
          <h1 className="heading-xl text-balance mb-5">
            {last ? (
              <>
                {first}
                <br />
                <span className="text-[var(--color-primary)]">{last}</span>
              </>
            ) : (
              <span className="text-[var(--color-primary)]">{headline}</span>
            )}
          </h1>
          <p className="font-[family-name:var(--font-display)] text-xl md:text-2xl tracking-[0.12em] uppercase text-[var(--color-crest-gold)] mb-5">
            {club.mottoCompact}
          </p>
          <p className="text-base md:text-lg text-[var(--color-muted)] max-w-xl leading-relaxed mb-8">
            {subhead}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="#join" className="btn btn-primary btn-xl">
              {cta} <ArrowRight size={16} />
            </a>
            <a href="#practice" className="btn btn-outline btn-xl">
              See practice times
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[var(--color-muted)]">
            <span className="inline-flex items-center gap-2">
              <Clock size={16} className="text-[var(--color-primary)]" />
              {club.practice.days} · {club.practice.time}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} className="text-[var(--color-primary)]" />
              {club.pitch.address}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
      <div className="container-x grid grid-cols-2 md:grid-cols-4">
        {club.stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`py-7 md:py-9 px-4 md:px-6 ${
              i > 0 ? "border-l border-[var(--color-border)]" : ""
            } ${i >= 2 ? "border-t md:border-t-0 border-[var(--color-border)]" : ""}`}
          >
            <div className="font-[family-name:var(--font-display)] text-3xl md:text-4xl tracking-wide">
              {stat.value}
            </div>
            <div className="mt-1 text-xs md:text-sm text-[var(--color-muted)] uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="section-pad">
      <div className="container-x grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="eyebrow mb-3">The club</p>
          <h2 className="heading-lg mb-5">
            Built for the game.
            <br />
            Bound by the pack.
          </h2>
          <p className="text-[var(--color-muted)] text-base md:text-lg leading-relaxed mb-6">
            Pensacola Aviators Rugby is the home of club rugby in Northwest
            Florida — men's Aviators and women's Aviatrix training side by side,
            competing in fifteens seasons and sevens weekends across the
            Southeast.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {club.values.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-card"
              >
                <div className="heading-md text-[var(--color-primary)] mb-2">
                  {v.title}
                </div>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {club.teams.map((team) => (
            <article
              key={team.name}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[0.7rem] uppercase tracking-wider text-[var(--color-muted)] mb-4">
                <Users size={14} /> {team.side}
              </div>
              <h3 className="heading-lg !text-3xl mb-3">{team.name}</h3>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                {team.description}
              </p>
            </article>
          ))}
          <article className="sm:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6">
            <div className="flex gap-5 items-start">
              <div className="flex size-14 items-center justify-center rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] shrink-0">
                <Shield size={28} />
              </div>
              <div>
                <h3 className="heading-md mb-1">New to rugby?</h3>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                  Perfect. Come to a Tuesday or Thursday session, meet the
                  coaches, and we'll put you in the right group.
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function Practice() {
  return (
    <section
      id="practice"
      className="section-pad bg-[var(--color-bg-elevated)] border-y border-[var(--color-border)]"
    >
      <div className="container-x grid gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-3">Practice</p>
          <h2 className="heading-lg mb-5">Where we train</h2>
          <p className="text-[var(--color-muted)] leading-relaxed mb-8 max-w-lg">
            Open practices twice a week at our pitch on Nine Mile Road. Bring
            athletic gear, water, and a willingness to learn.
          </p>
          <div className="space-y-4">
            <InfoRow
              icon={<CalendarDays size={20} />}
              label="Days"
              value={club.practice.days}
            />
            <InfoRow
              icon={<Clock size={20} />}
              label="Time"
              value={club.practice.time}
            />
            <InfoRow
              icon={<MapPin size={20} />}
              label="Pitch"
              value={`${club.pitch.address}, ${club.pitch.city}`}
            />
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href={club.pitch.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Open in Maps <ArrowRight size={16} />
            </a>
            <a href="#join" className="btn btn-secondary">
              I want to train
            </a>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-card flex flex-col justify-center">
          <p className="font-[family-name:var(--font-display)] text-2xl tracking-wide uppercase mb-4">
            {club.practice.note}
          </p>
          <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-border)] pt-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">
                Duration
              </div>
              <div className="font-[family-name:var(--font-display)] text-xl tracking-wide">
                2 hours
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-1">
                First session
              </div>
              <div className="font-[family-name:var(--font-display)] text-xl tracking-wide">
                Free
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
        {icon}
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-0.5">
          {label}
        </div>
        <div className="font-medium leading-snug">{value}</div>
      </div>
    </div>
  );
}

function Schedule({ site }: { site: SitePayload | null }) {
  const matches = site?.matches || [];
  const season = site?.presentation.current_season || "Season";
  const upcoming = matches.filter(
    (m) => m.status === "scheduled" || m.status === "postponed",
  );
  const results = matches
    .filter((m) => m.status === "final")
    .slice()
    .reverse();

  return (
    <section id="schedule" className="section-pad">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <p className="eyebrow mb-3">Calendar</p>
            <h2 className="heading-lg">What's on</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)] font-medium">
              {season}
            </p>
          </div>
          <p className="text-sm text-[var(--color-muted)] max-w-md md:text-right">
            Weekly practice is every Tuesday and Thursday. Match fixtures and
            results are updated by the club.
          </p>
        </div>

        <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card mb-8 max-w-md">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
              Practice
            </span>
            <span className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[0.7rem] text-[var(--color-muted)]">
              Weekly
            </span>
          </div>
          <h3 className="heading-md mb-4">Open Training</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-subtle)]">When</dt>
              <dd>{club.practice.days}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-subtle)]">Time</dt>
              <dd>{club.practice.time}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-subtle)]">Where</dt>
              <dd>{club.pitch.address}</dd>
            </div>
          </dl>
        </article>

        {upcoming.length > 0 && (
          <div className="mb-10">
            <h3 className="heading-md mb-4">Upcoming fixtures</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((m) => (
                <MatchCard key={m.id} m={m} />
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <h3 className="heading-md mb-4">Recent results</h3>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-card divide-y divide-[var(--color-border)]">
              {results.map((m) => {
                const ours = m.our_score ?? 0;
                const theirs = m.their_score ?? 0;
                const outcome = ours > theirs ? "W" : ours < theirs ? "L" : "D";
                return (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="grid size-9 place-items-center rounded-lg font-[family-name:var(--font-display)] text-sm border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                        {outcome}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          vs {m.opponent}
                        </div>
                        <div className="text-xs text-[var(--color-muted)]">
                          {formatDate(m.match_date)} · {m.location}
                        </div>
                      </div>
                    </div>
                    <div className="font-[family-name:var(--font-display)] text-2xl tracking-wide tabular-nums">
                      {ours}–{theirs}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!upcoming.length && !results.length && (
          <p className="text-sm text-[var(--color-muted)]">
            Season fixtures will post here once the club publishes them in
            admin.
          </p>
        )}
      </div>
    </section>
  );
}

function MatchCard({ m }: { m: Match }) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
          {m.team}
        </span>
        <span className="text-[0.7rem] uppercase tracking-wide text-[var(--color-muted)]">
          {m.location}
        </span>
      </div>
      <h4 className="font-[family-name:var(--font-display)] text-xl tracking-wide uppercase mb-2">
        vs {m.opponent}
      </h4>
      <p className="text-sm text-[var(--color-muted)]">
        {formatDate(m.match_date)}
        {m.kickoff_time ? ` · ${m.kickoff_time}` : ""}
      </p>
      {m.venue && (
        <p className="text-xs text-[var(--color-subtle)] mt-1">{m.venue}</p>
      )}
    </article>
  );
}

function formatDate(value: string) {
  const d = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function Gallery({ site }: { site: SitePayload | null }) {
  const images = site?.galleryImages || [];
  return (
    <section
      id="gallery"
      className="section-pad bg-[var(--color-bg-elevated)] border-y border-[var(--color-border)]"
    >
      <div className="container-x">
        <div className="mb-10">
          <p className="eyebrow mb-3">Gallery</p>
          <h2 className="heading-lg">Club moments</h2>
        </div>
        {images.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Photos will appear here after the club publishes them from the media
            library.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {images.map((img, i) => (
              <figure
                key={img.id}
                className={`relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card ${
                  i === 0
                    ? "md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto md:min-h-[28rem]"
                    : "aspect-[4/3]"
                }`}
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--color-bg)]/90 to-transparent p-4 pt-10 text-sm text-[var(--color-muted)]">
                  {img.alt || img.title}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Sponsors() {
  return (
    <section className="section-pad !py-14">
      <div className="container-x">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 md:px-10 shadow-card">
          <p className="eyebrow mb-2">Proud sponsors</p>
          <h2 className="heading-md !text-2xl mb-2">
            {club.sponsors[0].name}
          </h2>
          <p className="text-sm text-[var(--color-muted)] max-w-md">
            {club.sponsors[0].blurb} Interested in sponsoring? Reach out on
            socials.
          </p>
        </div>
      </div>
    </section>
  );
}

function Join() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.submitInquiry({
        name: name.trim(),
        contact: contact.trim(),
        note: note.trim() || undefined,
      });
      setSent(true);
      setName("");
      setContact("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="join" className="section-pad !pt-4">
      <div className="container-x grid gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-3">Recruiting</p>
          <h2 className="heading-lg mb-5">Ready to pull on the jersey?</h2>
          <p className="text-[var(--color-muted)] text-base md:text-lg leading-relaxed mb-8 max-w-xl">
            The fastest way in is simple: show up. Drop your details so we know
            you're coming, then join us Tuesday or Thursday at 6 PM.
          </p>
          <ol className="space-y-4">
            {club.joinSteps.map((s) => (
              <li
                key={s.step}
                className="flex gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-primary)] shrink-0 w-10">
                  {s.step}
                </div>
                <div>
                  <div className="heading-md !normal-case !tracking-normal mb-1">
                    {s.title}
                  </div>
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-card">
          <h3 className="heading-md mb-1">Tell us you're coming</h3>
          <p className="text-sm text-[var(--color-muted)] mb-6">
            No spam — just a heads-up so we can welcome you at practice.
          </p>
          {sent ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 text-center">
              <CheckCircle2
                size={40}
                className="text-[var(--color-primary)] mx-auto mb-3"
              />
              <p className="font-[family-name:var(--font-display)] text-xl tracking-wide uppercase mb-2">
                You're on the list
              </p>
              <p className="text-sm text-[var(--color-muted)] mb-5">
                Practice is {club.practice.days} at {club.practice.time}.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSent(false)}
              >
                Submit another
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block text-sm font-medium">
                Name
                <input
                  className="field mt-1.5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Phone or email
                <input
                  className="field mt-1.5"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Note <span className="text-[var(--color-subtle)]">(optional)</span>
                <textarea
                  className="field mt-1.5"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </label>
              {error && (
                <p className="text-sm text-[var(--color-primary)]">{error}</p>
              )}
              <button type="submit" className="btn btn-primary w-full" disabled={busy}>
                {busy ? "Sending…" : "I'm interested"}{" "}
                {!busy && <ArrowRight size={16} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
