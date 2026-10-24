-- SR MOTORS initial schema
-- Conventions:
--   * All monetary amounts are `numeric(14,2)` paired with an explicit ISO currency code column.
--   * Soft-delete / archive via `archived_at` (never hard-delete referenced records).
--   * `created_by` / `updated_by` reference auth.users(id) for audit traceability.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Admin profiles (authorization layer on top of Supabase Auth)
-- ---------------------------------------------------------------------------
create type public.admin_role as enum ('superadmin', 'admin', 'editor');

create table public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.admin_role not null default 'editor',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and is_active = true
  );
$$;

-- ---------------------------------------------------------------------------
-- Lookup tables (admin-managed taxonomies)
-- ---------------------------------------------------------------------------
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_media_id uuid,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicle_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete restrict,
  name text not null,
  slug text not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (brand_id, slug)
);

create table public.body_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  archived_at timestamptz
);

create table public.fuel_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  archived_at timestamptz
);

create table public.transmission_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  archived_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Media library
-- ---------------------------------------------------------------------------
create type public.media_type as enum ('image', 'video');

create table public.media (
  id uuid primary key default gen_random_uuid(),
  type public.media_type not null default 'image',
  storage_path text not null unique,
  mime_type text,
  filesize_bytes bigint,
  width int,
  height int,
  alt_text text,
  caption text,
  original_filename text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brands
  add constraint brands_logo_media_fk foreign key (logo_media_id) references public.media (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Vehicles
-- ---------------------------------------------------------------------------
create type public.vehicle_status as enum ('draft', 'available', 'reserved', 'sold', 'archived');
create type public.vehicle_condition as enum ('new', 'used', 'certified_pre_owned');
create type public.drivetrain_type as enum ('fwd', 'rwd', 'awd', 'four_wd');
create type public.steering_side as enum ('lhd', 'rhd');
create type public.mileage_unit as enum ('km', 'miles');

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,

  brand_id uuid not null references public.brands (id) on delete restrict,
  model_id uuid references public.vehicle_models (id) on delete restrict,
  model_name_override text, -- used when model_id is not in the lookup list yet
  trim text,
  year int not null check (year between 1980 and 2100),

  mileage_value numeric(10, 1),
  mileage_unit public.mileage_unit not null default 'km',

  fuel_type_id uuid references public.fuel_types (id) on delete restrict,
  transmission_id uuid references public.transmission_types (id) on delete restrict,
  engine_capacity_cc int,
  body_type_id uuid references public.body_types (id) on delete restrict,
  drivetrain public.drivetrain_type,
  steering public.steering_side,
  condition public.vehicle_condition not null default 'used',
  source_country text,
  location text,

  -- Shipping-relevant physical attributes
  cbm numeric(6, 2),

  -- Pricing (FOB only — see business rules in docs)
  fob_amount numeric(14, 2) not null,
  fob_currency text not null default 'USD',
  price_notes text,

  status public.vehicle_status not null default 'draft',
  featured boolean not null default false,

  description text,
  condition_notes text,

  main_media_id uuid references public.media (id) on delete set null,

  seo_title text,
  seo_description text,

  published_at timestamptz,
  archived_at timestamptz,

  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vehicles_status_idx on public.vehicles (status);
create index vehicles_featured_idx on public.vehicles (featured) where featured = true;
create index vehicles_brand_idx on public.vehicles (brand_id);
create index vehicles_year_idx on public.vehicles (year);
create index vehicles_created_at_idx on public.vehicles (created_at desc);

create table public.vehicle_media (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (vehicle_id, media_id)
);

create index vehicle_media_vehicle_idx on public.vehicle_media (vehicle_id, position);

-- ---------------------------------------------------------------------------
-- Shipping rates (admin-managed, time-bound, category/route specific)
-- ---------------------------------------------------------------------------
create type public.shipping_method as enum ('ro_ro', 'container_shared', 'container_exclusive', 'air');

create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  body_type_id uuid references public.body_types (id) on delete set null,
  method public.shipping_method not null default 'ro_ro',
  min_cbm numeric(6, 2),
  max_cbm numeric(6, 2),
  origin_port text not null,
  destination_port text not null default 'Tema, Ghana',
  rate_amount numeric(14, 2) not null,
  rate_currency text not null default 'USD',
  effective_from date not null default current_date,
  effective_to date,
  notes text,
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shipping_rates_validity_idx on public.shipping_rates (effective_from, effective_to);

-- ---------------------------------------------------------------------------
-- Currency reference rates (admin-entered; no invented/hardcoded conversion)
-- ---------------------------------------------------------------------------
create table public.currency_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null,
  quote_currency text not null,
  rate numeric(14, 6) not null,
  source text not null,
  as_of date not null default current_date,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index currency_rates_pair_idx on public.currency_rates (base_currency, quote_currency, as_of desc);

-- ---------------------------------------------------------------------------
-- Import cost estimates (one evolving estimate per vehicle, full history kept)
-- ---------------------------------------------------------------------------
create type public.estimate_status as enum ('unavailable', 'preliminary', 'reviewed', 'expired');

create table public.vehicle_cost_estimates (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  status public.estimate_status not null default 'unavailable',

  shipping_rate_id uuid references public.shipping_rates (id) on delete set null,
  shipping_amount numeric(14, 2),
  shipping_currency text default 'USD',

  customs_duty_amount numeric(14, 2),
  customs_currency text default 'GHS',
  customs_method text,

  port_charges_amount numeric(14, 2),
  clearing_fees_amount numeric(14, 2),
  local_transport_amount numeric(14, 2),
  other_charges_amount numeric(14, 2),
  other_charges_description text,

  assumptions text,
  notes text,

  calculated_at timestamptz not null default now(),
  review_due_at timestamptz,

  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vehicle_cost_estimates_vehicle_idx on public.vehicle_cost_estimates (vehicle_id, created_at desc);

-- A convenience view: the latest estimate per vehicle.
create view public.vehicle_latest_estimate as
  select distinct on (vehicle_id) *
  from public.vehicle_cost_estimates
  order by vehicle_id, created_at desc;

-- ---------------------------------------------------------------------------
-- Enquiries (CRM-lite)
-- ---------------------------------------------------------------------------
create type public.enquiry_status as enum ('new', 'contacted', 'negotiating', 'converted', 'closed');
create type public.contact_method as enum ('whatsapp', 'email', 'phone');
create type public.enquiry_source as enum ('vehicle_page', 'contact_page', 'calculator', 'other');

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles (id) on delete set null,
  name text not null,
  email text,
  phone text,
  preferred_contact_method public.contact_method not null default 'whatsapp',
  message text not null,
  source public.enquiry_source not null default 'other',
  estimate_reference text,
  cost_estimate_snapshot jsonb,
  status public.enquiry_status not null default 'new',
  assigned_to uuid references auth.users (id),
  follow_up_date date,
  -- basic spam protection
  honeypot text,
  submitted_ip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index enquiries_status_idx on public.enquiries (status);
create index enquiries_vehicle_idx on public.enquiries (vehicle_id);
create index enquiries_created_at_idx on public.enquiries (created_at desc);

create table public.enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries (id) on delete cascade,
  author_id uuid references auth.users (id),
  note text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Content / CMS
-- ---------------------------------------------------------------------------
create table public.content_blocks (
  key text primary key, -- e.g. 'home_hero', 'about', 'import_process', 'privacy_policy', 'terms'
  title text,
  body text, -- markdown
  data jsonb not null default '{}'::jsonb, -- structured fields (e.g. hero CTA labels)
  seo_title text,
  seo_description text,
  published boolean not null default false,
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null,
  cover_media_id uuid references public.media (id) on delete set null,
  author_name text default 'SR Motors',
  seo_title text,
  seo_description text,
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id),
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index audit_log_created_at_idx on public.audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'admin_profiles', 'brands', 'media', 'vehicles', 'shipping_rates',
    'vehicle_cost_estimates', 'enquiries', 'blog_posts'
  ]
  loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at();', t);
  end loop;
end $$;
