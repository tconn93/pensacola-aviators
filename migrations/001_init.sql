-- Core schema for Pensacola Aviators club site

create table if not exists admin_users (
  id serial primary key,
  email text not null unique,
  name text,
  password_hash text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists inquiries (
  id serial primary key,
  name text not null,
  contact text not null,
  note text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists inquiries_status_idx on inquiries (status, created_at desc);

create table if not exists club_settings (
  key text primary key,
  value text not null
);

insert into club_settings (key, value) values
  ('current_season', 'Fall 2026'),
  ('homepage_template', 'carousel'),
  ('homepage_headline', 'Pensacola Aviators'),
  ('homepage_subhead', 'Hard-running club rugby on the Gulf Coast. Train with the Aviators and Aviatrix every week — first-timers welcome.'),
  ('homepage_cta_label', 'Join the club')
on conflict (key) do nothing;

create table if not exists matches (
  id serial primary key,
  season text not null,
  team text not null default 'aviators',
  opponent text not null,
  match_date date not null,
  kickoff_time text,
  location text not null default 'home',
  venue text,
  status text not null default 'scheduled',
  our_score integer,
  their_score integer,
  notes text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matches_season_date_idx on matches (season, match_date);

create table if not exists media_assets (
  id serial primary key,
  title text,
  alt text not null default '',
  caption text,
  source_type text not null default 'upload',
  path text,
  data_url text,
  mime_type text,
  show_in_gallery boolean not null default true,
  show_on_home boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  uploaded_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_gallery_idx on media_assets (published, show_in_gallery, sort_order);
create index if not exists media_home_idx on media_assets (published, show_on_home, sort_order);

-- Session store for connect-pg-simple
create table if not exists session (
  sid varchar not null collate "default",
  sess json not null,
  expire timestamp(6) not null
);
alter table session drop constraint if exists session_pkey;
alter table session add constraint session_pkey primary key (sid) not deferrable initially immediate;
create index if not exists idx_session_expire on session (expire);
