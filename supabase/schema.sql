-- Read My Nails v2 — run the whole file in the Supabase SQL editor (safe to re-run).

-- Salons = paying licensees. One row per location. `tenant` is the slug in the kiosk URL (/k/<tenant>).
create table if not exists salons (
tenant text primary key,
name text not null,
email text not null,
host text default 'your host', -- the person who runs sessions
pin text not null, -- 4–6 digit host PIN for the kiosk app
status text not null default 'incomplete' check (status in ('incomplete','trialing','active','past_due','canceled','unpaid')),
plan text, -- monthly | annual
stripe_customer_id text,
stripe_subscription_id text, -- shared by all locations on a multi-location plan
seats int default 1, -- locations allowed on this subscription
referrer text, -- partner code that sent them (see partners)
-- public profile (salon directory)
listed boolean default false,
address text, city text, region text, postal text, country text default 'US',
phone text, instagram text, website text, hours text, blurb text,
lat double precision, lng double precision,
emails_sent jsonb default '[]'::jsonb,
current_period_end timestamptz,
created_at timestamptz default now(),
updated_at timestamptz default now()
);
create index if not exists salons_email on salons (email);
create index if not exists salons_sub on salons (stripe_subscription_id);

-- Partners = distributors / affiliates paid per salon they send. Code goes in ?ref=CODE links.
create table if not exists partners (
code text primary key, name text not null, email text, share_pct int default 20, created_at timestamptz default now()
);

-- Parties: one link a bride / quince court / team shares; each friend's order lands under the party name.
create table if not exists parties (
id text primary key, tenant text not null references tenants(id), name text not null, host text, date date, created_at timestamptz default now()
);

-- Legacy table from v1: kept for foreign keys. Every salon also gets a tenants row.
create table if not exists tenants (id text primary key, name text, created_at timestamptz default now());

create table if not exists settings (tenant text primary key references tenants(id), data jsonb not null, updated_at timestamptz default now());

create table if not exists orders (
id bigserial primary key, tenant text not null references tenants(id), code text not null,
status text not null default 'new' check (status in ('new','in_progress','done','cancelled')),
name text, lang text, set_code text, answer text, split boolean default false, who jsonb, price numeric(8,2) default 0,
hands jsonb not null, kiosk text, paid boolean default false, paid_at timestamptz,
source text default 'kiosk', -- kiosk | web (sent from readmynails.com)
phone text, -- optional, web orders only, for the SMS
party text references parties(id),
created_at timestamptz default now(), completed_at timestamptz,
unique (tenant, code)
);
create index if not exists orders_tenant_status on orders (tenant, status, created_at desc);

create table if not exists bookings (id text primary key, tenant text not null references tenants(id), name text, phone text, date date, time text, head int, pkg text, notes text, created_at timestamptz default now());

-- Re-running on a v2.0 database: add the new columns.
alter table salons add column if not exists seats int default 1;
alter table salons add column if not exists referrer text;
alter table salons add column if not exists listed boolean default false;
alter table salons add column if not exists address text; alter table salons add column if not exists city text; alter table salons add column if not exists region text; alter table salons add column if not exists postal text; alter table salons add column if not exists country text default 'US';
alter table salons add column if not exists phone text; alter table salons add column if not exists instagram text; alter table salons add column if not exists website text; alter table salons add column if not exists hours text; alter table salons add column if not exists blurb text;
alter table salons add column if not exists lat double precision; alter table salons add column if not exists lng double precision;
alter table salons add column if not exists emails_sent jsonb default '[]'::jsonb;
alter table orders add column if not exists source text default 'kiosk';
alter table orders add column if not exists phone text;
alter table orders add column if not exists party text references parties(id);
alter table salons drop constraint if exists salons_stripe_subscription_id_key;
alter table salons drop constraint if exists salons_stripe_customer_id_key;

-- Language layer: chapters a salon (or admin) had the engine write. status: draft → approved (live in that salon's kiosk) or global (every kiosk).
create table if not exists drafts (
id bigserial primary key, tenant text references tenants(id), lang text not null default 'EN', theme text not null, title text, blurb text,
sets jsonb not null, status text not null default 'draft' check (status in ('draft','approved','global','discarded')),
code text, created_by text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists drafts_tenant on drafts (tenant, created_at desc);

-- Approved chapters served to the kiosk app alongside the library. tenant '*' = every salon (network chapter).
create table if not exists custom_chapters (
code text not null, tenant text not null default '*', lang text not null, title text not null, blurb text, sets jsonb not null,
created_at timestamptz default now(), primary key (code, tenant)
);

-- Trust layer cache: one model verdict per phrase, forever.
create table if not exists screen_cache (mark_key text primary key, verdict jsonb not null, created_at timestamptz default now());

-- Request mining: every phrase typed into the generator or "say it for me". Next month's chapters come from here.
create table if not exists requests (id bigserial primary key, tenant text, lang text, kind text, phrase text not null, created_at timestamptz default now());
create index if not exists requests_time on requests (created_at desc);

-- Monthly drops: new chapters every licensee sees on the dashboard.
create table if not exists releases (
id bigserial primary key, title text not null, body text, file_path text, published_at timestamptz default now()
);

create or replace view sales_by_chapter as
select tenant, split_part(set_code,'-',1)||'-'||split_part(set_code,'-',2) as chapter, date(created_at) as day, count(*) as sets, sum(price) as revenue
from orders where status='done' group by 1,2,3;

-- Public salon directory view (only listed + paying).
create or replace view salon_directory as
select tenant, name, host, city, region, country, address, postal, phone, instagram, website, hours, blurb, lat, lng
from salons where listed and status in ('active','trialing','past_due');

-- Network trending: set codes ordered most across all salons, last 7 days (anonymous — no salon names).
create or replace view trending_sets as
select set_code, count(*) as orders from orders
where created_at > now() - interval '7 days' and set_code is not null and set_code <> 'CUSTOM'
group by set_code order by orders desc limit 50;

-- Licensee #1 (the Naples kiosk) — house plan, free forever. Rename or remove for a different first salon.
insert into tenants (id, name) values ('naples-coastland', 'Licensee 1 — Naples') on conflict do nothing;
insert into salons (tenant, name, email, host, pin, status, plan)
values ('naples-coastland', 'Licensee 1 — Naples', 'scottdelboccio@gmail.com', 'Host', '1234', 'active', 'house')
on conflict (tenant) do nothing;
update salons set listed = true, city = 'Naples', region = 'FL', country = 'US', lat = 26.1420, lng = -81.7948, blurb = 'The original Read My Nails kiosk. You print it, we teach you.' where tenant = 'naples-coastland' and city is null;

-- Lock the anon key out of every table. The app only reaches the database through the server (service role).
alter table salons enable row level security;
alter table orders enable row level security;
alter table bookings enable row level security;
alter table settings enable row level security;
alter table tenants enable row level security;
alter table releases enable row level security;
alter table partners enable row level security;
alter table parties enable row level security;
alter table drafts enable row level security;
alter table custom_chapters enable row level security;
alter table screen_cache enable row level security;
alter table requests enable row level security;

-- Storage: create a PRIVATE bucket named `library` in Storage and upload:
-- tiles.zip (all 1,671 tiles + sets.csv + tiles.csv)
-- Read-My-Nails-Library.pdf (the 151-page book)
-- menu-cards.zip (price board, how-it-works, station cards, counter cards — HTML + PDF)
-- session-script.pdf (the 12-minute session, word for word)
-- The dashboard hands out 1-hour signed links to paying salons only.

-- ============================================================================
-- v3 · PRICING-SPEC-v1 (credits + chapter claims). Safe to re-run.
-- An account is an email. Salons (kiosk licenses) share the email; chapters and credits belong to the account.
create table if not exists accounts (
email text primary key,
stripe_customer_id text,
library_all boolean default false, -- bought the Whole Library ($699): every chapter claimed, eligible for Drops
library_all_at timestamptz,
monthly_sub_id text, monthly_status text, -- $9.99/mo → 1 credit a month
drops_sub_id text, drops_status text, -- $9.99/mo → new chapters as they drop (Whole Library owners)
created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists accounts_customer on accounts (stripe_customer_id);

-- Credits: each purchase/invoice is one grant. Balance = sum(remaining) of live grants. `ref` makes Stripe events idempotent.
create table if not exists credit_grants (
id bigserial primary key,
email text not null references accounts(email),
amount int not null, remaining int not null,
reason text, -- start | monthly | salon | multi | chapter1 | chapter3 | admin
ref text unique, -- Stripe invoice id or checkout session id
subscription_id text, -- set when the credits came with a subscription (voided on cancel)
expires_at timestamptz, -- 12 months after grant
voided boolean default false,
created_at timestamptz default now()
);
create index if not exists credit_grants_email on credit_grants (email, voided, expires_at);

-- AI-generation overage (past the free 5/month on "Write a chapter" — app/api/ai/chapter/route.js). Reuses
-- credit_grants rather than a new table; `kind` keeps these balances ('ai_gen') from ever mixing with the
-- chapter-claim credits above ('chapter', the default so every existing row and call site is unaffected).
alter table credit_grants add column if not exists kind text not null default 'chapter';
create index if not exists credit_grants_kind on credit_grants (email, kind, voided, expires_at);

-- A claimed chapter is kept forever, even after the subscription ends.
create table if not exists chapter_claims (
email text not null references accounts(email),
chapter text not null, -- chapter code, e.g. EN-PUZZL
source text, -- credit | library | drops | admin
grant_id bigint,
created_at timestamptz default now(),
primary key (email, chapter)
);
create index if not exists chapter_claims_chapter on chapter_claims (chapter);

alter table accounts enable row level security;
alter table credit_grants enable row level security;
alter table chapter_claims enable row level security;

-- Licensee #1 (Naples) is on the house plan → sees every chapter; nothing to claim.
