-- Row Level Security: public (anon) can only ever read published/available
-- records; every write and every "draft"/internal read requires an active
-- admin_profiles row (checked via public.is_admin(), a security-definer fn).

alter table public.admin_profiles enable row level security;
alter table public.brands enable row level security;
alter table public.vehicle_models enable row level security;
alter table public.body_types enable row level security;
alter table public.fuel_types enable row level security;
alter table public.transmission_types enable row level security;
alter table public.media enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_media enable row level security;
alter table public.shipping_rates enable row level security;
alter table public.currency_rates enable row level security;
alter table public.vehicle_cost_estimates enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_notes enable row level security;
alter table public.content_blocks enable row level security;
alter table public.faqs enable row level security;
alter table public.blog_posts enable row level security;
alter table public.audit_log enable row level security;

-- admin_profiles: admins can read all profiles; a user can read their own row.
create policy "admin_profiles self or admin read" on public.admin_profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "admin_profiles admin write" on public.admin_profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Lookup taxonomies: public can read non-archived rows; admins manage all.
create policy "brands public read" on public.brands
  for select using (archived_at is null or public.is_admin());
create policy "brands admin write" on public.brands
  for insert with check (public.is_admin());
create policy "brands admin update" on public.brands
  for update using (public.is_admin()) with check (public.is_admin());
create policy "brands admin delete" on public.brands
  for delete using (public.is_admin());

create policy "vehicle_models public read" on public.vehicle_models
  for select using (archived_at is null or public.is_admin());
create policy "vehicle_models admin write" on public.vehicle_models
  for insert with check (public.is_admin());
create policy "vehicle_models admin update" on public.vehicle_models
  for update using (public.is_admin()) with check (public.is_admin());
create policy "vehicle_models admin delete" on public.vehicle_models
  for delete using (public.is_admin());

create policy "body_types public read" on public.body_types
  for select using (archived_at is null or public.is_admin());
create policy "body_types admin write" on public.body_types
  for insert with check (public.is_admin());
create policy "body_types admin update" on public.body_types
  for update using (public.is_admin()) with check (public.is_admin());
create policy "body_types admin delete" on public.body_types
  for delete using (public.is_admin());

create policy "fuel_types public read" on public.fuel_types
  for select using (archived_at is null or public.is_admin());
create policy "fuel_types admin write" on public.fuel_types
  for insert with check (public.is_admin());
create policy "fuel_types admin update" on public.fuel_types
  for update using (public.is_admin()) with check (public.is_admin());
create policy "fuel_types admin delete" on public.fuel_types
  for delete using (public.is_admin());

create policy "transmission_types public read" on public.transmission_types
  for select using (archived_at is null or public.is_admin());
create policy "transmission_types admin write" on public.transmission_types
  for insert with check (public.is_admin());
create policy "transmission_types admin update" on public.transmission_types
  for update using (public.is_admin()) with check (public.is_admin());
create policy "transmission_types admin delete" on public.transmission_types
  for delete using (public.is_admin());

-- Media: public can read (it's only ever linked from published content);
-- only admins can list/manage the raw library.
create policy "media public read" on public.media
  for select using (true);
create policy "media admin write" on public.media
  for insert with check (public.is_admin());
create policy "media admin update" on public.media
  for update using (public.is_admin()) with check (public.is_admin());
create policy "media admin delete" on public.media
  for delete using (public.is_admin());

-- Vehicles: public can read only published, non-archived listings that are
-- available/reserved/sold (sold stays visible so URLs don't 404); drafts and
-- archived rows are admin-only.
create policy "vehicles public read" on public.vehicles
  for select using (
    (published_at is not null and archived_at is null and status <> 'draft')
    or public.is_admin()
  );
create policy "vehicles admin write" on public.vehicles
  for insert with check (public.is_admin());
create policy "vehicles admin update" on public.vehicles
  for update using (public.is_admin()) with check (public.is_admin());
create policy "vehicles admin delete" on public.vehicles
  for delete using (public.is_admin());

create policy "vehicle_media public read" on public.vehicle_media
  for select using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id
        and ((v.published_at is not null and v.archived_at is null and v.status <> 'draft') or public.is_admin())
    )
  );
create policy "vehicle_media admin write" on public.vehicle_media
  for insert with check (public.is_admin());
create policy "vehicle_media admin update" on public.vehicle_media
  for update using (public.is_admin()) with check (public.is_admin());
create policy "vehicle_media admin delete" on public.vehicle_media
  for delete using (public.is_admin());

-- Shipping rates / currency rates: operational data, admin-only (the public
-- site only ever sees the derived estimate, never the raw rate table).
create policy "shipping_rates admin only" on public.shipping_rates
  for all using (public.is_admin()) with check (public.is_admin());
create policy "currency_rates admin only" on public.currency_rates
  for all using (public.is_admin()) with check (public.is_admin());

-- Cost estimates: public can read an estimate only for a vehicle they can
-- already see; all writes are admin-only.
create policy "vehicle_cost_estimates public read" on public.vehicle_cost_estimates
  for select using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id
        and ((v.published_at is not null and v.archived_at is null and v.status <> 'draft') or public.is_admin())
    )
  );
create policy "vehicle_cost_estimates admin write" on public.vehicle_cost_estimates
  for insert with check (public.is_admin());
create policy "vehicle_cost_estimates admin update" on public.vehicle_cost_estimates
  for update using (public.is_admin()) with check (public.is_admin());
create policy "vehicle_cost_estimates admin delete" on public.vehicle_cost_estimates
  for delete using (public.is_admin());

-- Enquiries: anyone can create (the public contact/enquiry forms), nobody
-- outside admins can read, update or delete — this is the customers' PII.
create policy "enquiries public insert" on public.enquiries
  for insert with check (true);
create policy "enquiries admin read" on public.enquiries
  for select using (public.is_admin());
create policy "enquiries admin update" on public.enquiries
  for update using (public.is_admin()) with check (public.is_admin());
create policy "enquiries admin delete" on public.enquiries
  for delete using (public.is_admin());

create policy "enquiry_notes admin only" on public.enquiry_notes
  for all using (public.is_admin()) with check (public.is_admin());

-- CMS content: public reads only published rows; admins manage everything.
create policy "content_blocks public read" on public.content_blocks
  for select using (published or public.is_admin());
create policy "content_blocks admin write" on public.content_blocks
  for insert with check (public.is_admin());
create policy "content_blocks admin update" on public.content_blocks
  for update using (public.is_admin()) with check (public.is_admin());
create policy "content_blocks admin delete" on public.content_blocks
  for delete using (public.is_admin());

create policy "faqs public read" on public.faqs
  for select using (published or public.is_admin());
create policy "faqs admin write" on public.faqs
  for insert with check (public.is_admin());
create policy "faqs admin update" on public.faqs
  for update using (public.is_admin()) with check (public.is_admin());
create policy "faqs admin delete" on public.faqs
  for delete using (public.is_admin());

create policy "blog_posts public read" on public.blog_posts
  for select using (published or public.is_admin());
create policy "blog_posts admin write" on public.blog_posts
  for insert with check (public.is_admin());
create policy "blog_posts admin update" on public.blog_posts
  for update using (public.is_admin()) with check (public.is_admin());
create policy "blog_posts admin delete" on public.blog_posts
  for delete using (public.is_admin());

-- Audit log: admin-read-only; rows are only ever inserted by server-side
-- code running with the service role (which bypasses RLS entirely), so no
-- insert policy is granted to any ordinary role.
create policy "audit_log admin read" on public.audit_log
  for select using (public.is_admin());
