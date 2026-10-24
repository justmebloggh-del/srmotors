-- Local/dev seed data. Safe to re-run (idempotent upserts where practical).
-- This does NOT create an auth user — run `npm run db:seed:admin` (see
-- scripts/create-first-admin.ts) after `supabase start` to provision the
-- first administrator via the Auth Admin API.

insert into public.brands (name, slug) values
  ('Toyota', 'toyota'),
  ('Lexus', 'lexus'),
  ('Honda', 'honda'),
  ('Mercedes-Benz', 'mercedes-benz'),
  ('BMW', 'bmw'),
  ('Ford', 'ford'),
  ('Nissan', 'nissan'),
  ('Hyundai', 'hyundai'),
  ('Kia', 'kia')
on conflict (name) do nothing;

insert into public.body_types (name, slug) values
  ('Sedan', 'sedan'),
  ('SUV', 'suv'),
  ('Pickup Truck', 'pickup-truck'),
  ('Minivan', 'minivan'),
  ('Coupe', 'coupe'),
  ('Hatchback', 'hatchback'),
  ('Station Wagon', 'station-wagon')
on conflict (name) do nothing;

insert into public.fuel_types (name, slug) values
  ('Petrol', 'petrol'),
  ('Diesel', 'diesel'),
  ('Hybrid', 'hybrid'),
  ('Electric', 'electric')
on conflict (name) do nothing;

insert into public.transmission_types (name, slug) values
  ('Automatic', 'automatic'),
  ('Manual', 'manual'),
  ('CVT', 'cvt')
on conflict (name) do nothing;

insert into public.vehicle_models (brand_id, name, slug)
select b.id, m.name, m.slug
from public.brands b
join (values
  ('Toyota', 'Land Cruiser', 'land-cruiser'),
  ('Toyota', 'Camry', 'camry'),
  ('Toyota', 'Hilux', 'hilux'),
  ('Lexus', 'RX 350', 'rx-350'),
  ('Honda', 'Accord', 'accord'),
  ('Mercedes-Benz', 'C-Class', 'c-class'),
  ('BMW', 'X5', 'x5')
) as m(brand, name, slug) on m.brand = b.name
on conflict (brand_id, slug) do nothing;

insert into public.shipping_rates (body_type_id, method, min_cbm, max_cbm, origin_port, destination_port, rate_amount, rate_currency, effective_from, effective_to, notes)
select bt.id, 'ro_ro'::public.shipping_method, 0, 20, 'Atlanta, USA', 'Tema, Ghana', 1250.00, 'USD', current_date - interval '7 days', current_date + interval '23 days', 'Seed rate for local testing only — not a real quote.'
from public.body_types bt where bt.slug = 'sedan'
union all
select bt.id, 'ro_ro'::public.shipping_method, 0, 20, 'Atlanta, USA', 'Tema, Ghana', 1550.00, 'USD', current_date - interval '7 days', current_date + interval '23 days', 'Seed rate for local testing only — not a real quote.'
from public.body_types bt where bt.slug = 'suv'
union all
select bt.id, 'ro_ro'::public.shipping_method, 0, 20, 'Atlanta, USA', 'Tema, Ghana', 1700.00, 'USD', current_date - interval '7 days', current_date + interval '23 days', 'Seed rate for local testing only — not a real quote.'
from public.body_types bt where bt.slug = 'pickup-truck';

insert into public.content_blocks (key, title, body, data, published) values
  ('home_hero', 'Find Your Next Car with Confidence.',
   'SR Motors helps you source vehicles and arrange transparent imports to Ghana — real FOB prices, honest shipping and customs guidance, and a straightforward process from browsing to collection.',
   '{"primary_cta_label": "Explore Vehicles", "primary_cta_href": "/vehicles", "secondary_cta_label": "Estimate Import Cost", "secondary_cta_href": "/import-calculator"}'::jsonb,
   true),
  ('about', 'About SR Motors',
   'SR Motors sources and imports vehicles for customers across Ghana. We publish transparent FOB pricing, explain every cost that is added on top, and work directly with you from the first enquiry through to collection in Ghana.',
   '{}'::jsonb, true),
  ('import_process', 'How Importing With SR Motors Works',
   'A straightforward, transparent seven-step journey from browsing to collection.',
   '{}'::jsonb, true),
  ('privacy_policy', 'Privacy Policy', 'This placeholder privacy policy should be replaced with SR Motors'' reviewed legal copy before launch.', '{}'::jsonb, true),
  ('terms', 'Terms & Conditions', 'This placeholder terms & conditions copy should be replaced with SR Motors'' reviewed legal copy before launch.', '{}'::jsonb, true)
on conflict (key) do nothing;

insert into public.faqs (question, answer, position, published) values
  ('Is the listed price the final price I will pay?', 'No. The listed price is the FOB (Free On Board) price only. Shipping, Ghana Customs duty, port charges, clearing fees and local transport are additional — contact us for a current import-cost estimate.', 1, true),
  ('How long does shipping to Ghana take?', 'This depends on the shipping method, origin port, and current vessel schedules. Ask us for the current estimate for a specific vehicle.', 2, true),
  ('Can I get an exact customs duty figure before I buy?', 'We provide a preliminary, indicative estimate. The final amount is determined by Ghana Customs during the official clearance process.', 3, true)
on conflict do nothing;

-- Sample vehicles for local testing of inventory/detail/filter pages.
do $$
declare
  v_toyota uuid; v_landcruiser uuid; v_suv uuid; v_diesel uuid; v_auto uuid; v_id uuid;
  v_honda uuid; v_accord uuid; v_sedan uuid; v_petrol uuid;
begin
  select id into v_toyota from public.brands where slug = 'toyota';
  select id into v_landcruiser from public.vehicle_models where slug = 'land-cruiser';
  select id into v_suv from public.body_types where slug = 'suv';
  select id into v_diesel from public.fuel_types where slug = 'diesel';
  select id into v_auto from public.transmission_types where slug = 'automatic';

  select id into v_honda from public.brands where slug = 'honda';
  select id into v_accord from public.vehicle_models where slug = 'accord';
  select id into v_sedan from public.body_types where slug = 'sedan';
  select id into v_petrol from public.fuel_types where slug = 'petrol';

  insert into public.vehicles (
    slug, brand_id, model_id, trim, year, mileage_value, mileage_unit,
    fuel_type_id, transmission_id, engine_capacity_cc, body_type_id,
    drivetrain, steering, condition, source_country, location, cbm,
    fob_amount, fob_currency, status, featured, description,
    published_at
  ) values (
    'toyota-land-cruiser-2022-a1b2c3', v_toyota, v_landcruiser, 'GXR', 2022, 32000, 'km',
    v_diesel, v_auto, 4461, v_suv,
    'four_wd', 'lhd', 'used', 'United Arab Emirates', 'Dubai, UAE', 18.5,
    58000, 'USD', 'available', true,
    'Clean, well-maintained Land Cruiser GXR sourced from the UAE. Full service history available on request.',
    now()
  ) returning id into v_id;

  insert into public.vehicles (
    slug, brand_id, model_id, trim, year, mileage_value, mileage_unit,
    fuel_type_id, transmission_id, engine_capacity_cc, body_type_id,
    drivetrain, steering, condition, source_country, location, cbm,
    fob_amount, fob_currency, status, featured, description,
    published_at
  ) values (
    'honda-accord-2020-d4e5f6', v_honda, v_accord, 'EX-L', 2020, 41500, 'miles',
    v_petrol, v_auto, 1998, v_sedan,
    'fwd', 'lhd', 'used', 'United States', 'Atlanta, USA', 11.2,
    17500, 'USD', 'available', false,
    'Accident-free Accord EX-L with leather interior and sunroof.',
    now()
  );
end $$;
