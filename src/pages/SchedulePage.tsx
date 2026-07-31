import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react";
import { api, type Match, type SitePayload } from "@/lib/api";
import { usePageMeta } from "@/hooks/usePageMeta";

export function SchedulePage() {
  usePageMeta(
    "Schedule & Results",
    "Pensacola Aviators Rugby match schedule, fixtures, and results. Upcoming home and away matches for the Fall season.",
  );
  const [site, setSite] = useState<SitePayload | null>(null);

  useEffect(() => {
    api.site().then(setSite).catch(() => setSite(null));
  }, []);

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
                          <div className="font-medium text-sm truncate">{m.location === "tourney" ? m.opponent : `vs ${m.opponent}`}
                            {m.is_matrix && <span className="ml-1 text-[0.55rem] font-semibold uppercase tracking-wider text-[var(--color-accent)]">Matrix</span>}
                          </div>
                          <div className="text-xs text-[var(--color-muted)]">
                            {formatDateTime(m.match_date, m.kickoff_time)} · {m.location}
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
      <h4 className="font-[family-name:var(--font-display)] text-xl tracking-wide uppercase mb-2">{m.location === "tourney" ? m.opponent : `vs ${m.opponent}`}
        {m.is_matrix && <span className="ml-2 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--color-accent)] align-middle">Matrix</span>}
      </h4>
      <p className="text-sm text-[var(--color-muted)]">
        {formatDateTime(m.match_date, m.kickoff_time)}
      </p>
      {m.venue && m.location === "home" && <p className="text-xs text-[var(--color-subtle)] mt-1">{m.venue}</p>}
    </article>
  );
}

function formatDateTime(value: string, time: string | null) {
  // Parse YYYY-MM-DD directly to avoid timezone shift
  const parts = value.split("T")[0].split("-");
  if (parts.length !== 3) return value;
  const [y, m, d] = parts;
  return `${m}/${d}/${y}${time ? ` - ${time}` : ""}`;
}
