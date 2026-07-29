const base = "";

async function req<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText);
  }
  return data as T;
}

export const api = {
  health: () => req<{ ok: boolean; db: string }>("/api/health"),
  site: () => req<SitePayload>("/api/site"),
  submitInquiry: (body: { name: string; contact: string; note?: string }) =>
    req<{ ok: boolean; id: number }>("/api/inquiries", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (email: string, password: string) =>
    req<{ ok: boolean; admin: Admin }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => req<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  me: () => req<{ admin: Admin }>("/api/auth/me"),
  inquiries: () => req<Inquiry[]>("/api/admin/inquiries"),
  updateInquiry: (id: number, status: string) =>
    req(`/api/admin/inquiries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteInquiry: (id: number) =>
    req(`/api/admin/inquiries/${id}`, { method: "DELETE" }),
  matches: () =>
    req<{ currentSeason: string; matches: Match[] }>("/api/admin/matches"),
  setSeason: (season: string) =>
    req("/api/admin/season", {
      method: "POST",
      body: JSON.stringify({ season }),
    }),
  createMatch: (body: Partial<Match>) =>
    req("/api/admin/matches", { method: "POST", body: JSON.stringify(body) }),
  updateMatch: (id: number, body: Partial<Match>) =>
    req(`/api/admin/matches/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteMatch: (id: number) =>
    req(`/api/admin/matches/${id}`, { method: "DELETE" }),
  media: () => req<Media[]>("/api/admin/media"),
  uploadMedia: (body: Record<string, unknown>) =>
    req("/api/admin/media", { method: "POST", body: JSON.stringify(body) }),
  patchMedia: (id: number, body: Record<string, unknown>) =>
    req(`/api/admin/media/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteMedia: (id: number) =>
    req(`/api/admin/media/${id}`, { method: "DELETE" }),
  settings: () => req<SiteSettings>("/api/admin/settings"),
  saveSettings: (body: SiteSettings) =>
    req("/api/admin/settings", { method: "PUT", body: JSON.stringify(body) }),
  admins: () => req<AdminRow[]>("/api/admin/admins"),
  addAdmin: (body: { email: string; name?: string; password?: string }) =>
    req("/api/admin/admins", { method: "POST", body: JSON.stringify(body) }),
  removeAdmin: (id: number) =>
    req(`/api/admin/admins/${id}`, { method: "DELETE" }),
};

export type Admin = {
  id: number;
  email: string;
  name: string | null;
  role: string;
};

export type Inquiry = {
  id: number;
  name: string;
  contact: string;
  note: string | null;
  status: string;
  created_at: string;
};

export type Match = {
  id: number;
  season: string;
  team: string;
  opponent: string;
  match_date: string;
  kickoff_time: string | null;
  location: string;
  venue: string | null;
  status: string;
  our_score: number | null;
  their_score: number | null;
  notes: string | null;
  published: boolean;
};

export type Media = {
  id: number;
  title: string | null;
  alt: string;
  url: string;
  show_in_gallery: boolean;
  show_on_home: boolean;
  published: boolean;
  sort_order: number;
};

export type SiteSettings = {
  homepage_template: string;
  homepage_headline: string;
  homepage_subhead: string;
  homepage_cta_label: string;
};

export type SitePayload = {
  presentation: SiteSettings & { current_season: string };
  homeImages: Media[];
  galleryImages: Media[];
  matches: Match[];
};

export type AdminRow = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
};
