import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#about", label: "About" },
  { href: "#practice", label: "Practice" },
  { href: "#schedule", label: "Schedule" },
  { href: "#gallery", label: "Gallery" },
  { href: "#join", label: "Join" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--color-border)]/60 bg-[var(--color-bg)]/80 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <a href="#top" className="font-[family-name:var(--font-display)] text-lg tracking-wide uppercase">
          Pensacola <span className="text-[var(--color-primary)]">Aviators</span>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm text-[var(--color-muted)]">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-[var(--color-fg)] transition-colors">
              {l.label}
            </a>
          ))}
          <Link to="/login" className="btn btn-outline btn-sm">
            Club staff
          </Link>
        </nav>
        <button
          type="button"
          className="md:hidden btn btn-ghost btn-sm"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-5 py-4 space-y-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="block text-sm text-[var(--color-muted)]"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>
            Club staff login
          </Link>
        </div>
      )}
    </header>
  );
}
