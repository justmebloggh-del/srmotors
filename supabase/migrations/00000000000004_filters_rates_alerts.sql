-- Normalised mileage so one "max mileage" filter works across km and miles listings.
alter table public.vehicles
  add column mileage_km numeric(12, 1)
  generated always as (
    case when mileage_unit = 'miles' then round(mileage_value * 1.609344, 1) else mileage_value end
  ) stored;

create index vehicles_mileage_km_idx on public.vehicles (mileage_km);
create index vehicles_engine_cc_idx on public.vehicles (engine_capacity_cc);
create index vehicles_source_country_idx on public.vehicles (source_country);

-- Exchange rates are displayed publicly (with source + date) to show
-- indicative GHS prices, so visitors may read them. Writes stay admin-only
-- via the existing "currency_rates admin only" policy.
create policy "currency_rates public read" on public.currency_rates
  for select using (true);

-- Record of each enquiry alert attempt, so a failed notification is visible
-- to admins instead of silently lost.
alter table public.enquiries
  add column alert_sent_at timestamptz,
  add column alert_error text;
