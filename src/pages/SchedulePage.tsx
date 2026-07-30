import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react";
import { api, type Match, type SitePayload } from "@/lib/api";

export function SchedulePage() {
  const [site, setSite] = useState<SitePayload | null>(null);

  useEffect(() => {
    api.site().then(setSite).catch(() => setSite(null));
  }, []);

  const matches = site?.matches || [];
  const season = site?.presentation.current_season || "Season";
  const pDays = site?.club_content?.practice_days || "Tuesdays & Thursdays";
  const pTime = site?.club_content?.practice_time || "6:00 – 8:00 PM";
  const pAddr = site?.club_content?.pitch_address || "555 E Nine Mile Rd";

  const upcoming = matches.filter(
    (m) => m.status === "scheduled" || m.status === "postponed",
  );
  const results = matches
    .filter((m) => m.status === "final")
    .slice()
    .reverse();

  return (
    <main>
      <section className="section-pad mt-16">
        <div className="container-x">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)] mb-6">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <p className="eyebrow mb-3">Calendar</p>
              <h1 className="heading-lg">Schedule &amp; results</h1>
              <p className="mt-2 text-sm text-[var(--color-muted)] font-medium">{season}</p>
            </div>
          </div>

          <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card mb-8 max-w-md">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">Practice</span>
              <span className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[0.7rem] text-[var(--color-muted)]">Weekly</span>
            </div>
            <h3 className="heading-md mb-4">Open Training</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-subtle)]">When</dt>
                <dd>{pDays}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-subtle)]">Time</dt>
                <dd>{pTime}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-subtle)]">Where</dt>
                <dd>{pAddr}</dd>
              </div>
            </dl>
          </article>

          {upcoming.length > 0 && (
            <div className="mb-10">
              <h2 className="heading-md mb-4">Upcoming fixtures</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((m) => (
                  <MatchCard key={m.id} m={m} />
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div>
              <h2 className="heading-md mb-4">Recent results</h2>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-card divide-y divide-[var(--color-border)]">
                {results.map((m) => {
                  const ours = m.our_score ?? 0;
                  const theirs = m.their_score ?? 0;
                  const outcome = ours > theirs ? "W" : ours < theirs ? "L" : "D";
                  return (
                    <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="grid size-9 place-items-center rounded-lg font-[family-name:var(--font-display)] text-sm border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                          {outcome}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">vs {m.opponent}</div>
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
              Season fixtures will post here once the club publishes them in admin.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function MatchCard({ m }: { m: Match }) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-card">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">{m.team}</span>
        <span className="text-[0.7rem] uppercase tracking-wide text-[var(--color-muted)]">{m.location}</span>
      </div>
      <h4 className="font-[family-name:var(--font-display)] text-xl tracking-wide uppercase mb-2">vs {m.opponent}</h4>
      <p className="text-sm text-[var(--color-muted)]">
        {formatDate(m.match_date)}
        {m.kickoff_time ? ` · ${m.kickoff_time}` : ""}
      </p>
      {m.venue && <p className="text-xs text-[var(--color-subtle)] mt-1">{m.venue}</p>}
    </article>
  );
}

function formatDate(value: string) {
  const d = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
