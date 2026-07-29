import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center px-5 bg-[var(--color-bg)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-card">
        <h1 className="heading-lg !text-2xl mb-2">Admin sign in</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          Club staff only. Default seed user after migrate:{" "}
          <code className="text-[var(--color-fg)]">admin@pcolarugby.com</code> /{" "}
          <code className="text-[var(--color-fg)]">aviators</code>
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              className="field mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              type="password"
              className="field mt-1.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error && (
            <p className="text-sm text-[var(--color-primary)]">{error}</p>
          )}
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-sm text-center">
          <Link to="/" className="text-[var(--color-muted)] hover:text-[var(--color-fg)]">
            Back to public site
          </Link>
        </p>
      </div>
    </main>
  );
}
