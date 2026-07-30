create table if not exists sponsors (
  id integer primary key generated always as identity,
  name text not null,
  blurb text not null default '',
  logo_url text,
  website_url text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed the default sponsor from old settings if not exists
insert into sponsors (name, blurb, sort_order, published)
select coalesce(cs.value, 'Local partners'), coalesce(cs2.value, 'Thanks to the businesses that keep the club flying.'), 0, true
from (select value from club_settings where key = 'sponsor_name') cs
full join (select value from club_settings where key = 'sponsor_blurb') cs2 on true
where not exists (select 1 from sponsors);
