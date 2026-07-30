import { useEffect, useState } from "react";
import { api, type SitePayload } from "@/lib/api";

export function SiteFooter() {
  const [site, setSite] = useState<SitePayload | null>(null);

  useEffect(() => {
    api.site().then(setSite).catch(() => setSite(null));
  }, []);

  const addr = site?.club_content?.pitch_address || "555 E Nine Mile Rd";
  const city = site?.club_content?.pitch_city || "Pensacola, FL";
  const igUrl = site?.club_content?.instagram_url || "https://www.instagram.com/pensacola_rugby/";
  const fbUrl = site?.club_content?.facebook_url || "https://www.facebook.com/pensacolarugby/";

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-10">
      <div className="container-x flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-[var(--color-muted)]">
        <div>
          <div className="font-[family-name:var(--font-display)] text-lg tracking-wide uppercase text-[var(--color-fg)] mb-1">
            Pensacola Aviators
          </div>
          <p>
            {addr}, {city}
          </p>
        </div>
        <div className="flex gap-4">
          <a href={igUrl} target="_blank" rel="noreferrer" className="hover:text-[var(--color-fg)]">
            Instagram
          </a>
          <a href={fbUrl} target="_blank" rel="noreferrer" className="hover:text-[var(--color-fg)]">
            Facebook
          </a>
        </div>
      </div>
    </footer>
  );
}
