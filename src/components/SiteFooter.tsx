import { club } from "@/data/club";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-10">
      <div className="container-x flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-[var(--color-muted)]">
        <div>
          <div className="font-[family-name:var(--font-display)] text-lg tracking-wide uppercase text-[var(--color-fg)] mb-1">
            Pensacola Aviators
          </div>
          <p>
            {club.pitch.address}, {club.pitch.city}
          </p>
        </div>
        <div className="flex gap-4">
          <a href={club.socials.instagram} target="_blank" rel="noreferrer" className="hover:text-[var(--color-fg)]">
            Instagram
          </a>
          <a href={club.socials.facebook} target="_blank" rel="noreferrer" className="hover:text-[var(--color-fg)]">
            Facebook
          </a>
        </div>
      </div>
    </footer>
  );
}
