create table if not exists albums (
  id integer primary key generated always as identity,
  name text not null,
  description text not null default '',
  cover_image_id integer references media_assets(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table media_assets add column if not exists album_id integer references albums(id) on delete set null;
