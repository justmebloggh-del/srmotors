# SR Motors — Automobile Sales & Import Platform

A production-ready marketplace and admin dashboard for SR Motors, a Ghana-focused
automobile sales and import business. Next.js (App Router) + TypeScript + Tailwind
+ shadcn/ui + Supabase (Postgres, Auth, Storage).

Tagline: **Driven by Trust. Defined by Quality.**

## What's implemented

**Public site** — home, vehicle inventory with filters/sort/pagination (URL-shareable),
vehicle detail pages with gallery, transparent FOB/import-cost breakdown, WhatsApp/Telegram
enquiry flows, import cost calculator, import process, brands index, about, contact, FAQ
(with FAQPage structured data), blog, privacy policy / terms, sitemap.xml, robots.txt,
Organization/WebSite/Vehicle/BreadcrumbList JSON-LD.

**Admin dashboard** (`/admin`) — Supabase Auth sign-in (no public registration), dashboard
metrics, full vehicle CRUD with multi-image/video upload + gallery reordering + featured
image selection, draft/publish/status workflow, duplicate, soft-archive (never hard-deletes
a vehicle that has enquiries), brand/body-type/fuel-type/transmission-type management,
shipping rate tiers, per-vehicle import-cost estimate editor with full history, enquiry
inbox with status/notes/follow-up, site content editor (hero, about, import process,
legal pages, FAQs), blog editor, audit log viewer, and a one-click social post generator
per vehicle.

**Business rules enforced in code** — every price is explicitly FOB-only with the required
disclaimer shown everywhere a price appears; shipping/customs/port/clearing figures are
never fabricated — a missing figure always renders as "Not yet confirmed," never zero or a
guess; a landed-cost total is only ever shown when every component is confirmed in one
currency; every cost estimate carries a status (`unavailable` / `preliminary` / `reviewed`
/ `expired`), a reference ID and a generation timestamp.

## What's intentionally out of scope for this phase

These require business decisions, credentials, or data SR Motors hasn't provided yet. The
schema and UI are built so they can be added without rework:

- Any real exchange-rate or Ghana Customs/ICUMS API integration (per the brief: never
  invent rates or claim an unauthorised ICUMS affiliation — `vehicle_cost_estimates` is
  entirely admin-entered until a real, authorised source is configured).
- Google Analytics / Search Console / Tag Manager wiring (env vars are stubbed in
  `.env.example`; add the real IDs when ready).
- Multi-factor admin auth (Supabase Auth supports it; not enabled by default).
- A full drag-and-drop media reorder (current UI uses up/down + "set as main" controls).
- Direct Instagram/TikTok share intents (neither platform offers a public URL-based share
  endpoint — footer/social config links to your profiles instead).

## Tech stack

- Next.js 16 (App Router, Turbopack) + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui (Base UI primitives)
- Supabase: Postgres + Row Level Security, Auth, Storage
- Zod validation, React Hook Form
- Sonner (toasts), Lucide icons

## Project structure

```
src/
  app/
    (site)/            Public pages (shares header/footer layout)
    admin/              /admin/login, /admin/reset-password (public)
      (dashboard)/      Everything else under /admin (protected by requireAdmin())
    actions/            Server Actions (mutations) — every one calls requireAdmin()
                        where privileged, in addition to RLS enforcing it at the DB layer
  components/
    layout/, home/, vehicles/, shared/, admin/, ui/ (shadcn)
  lib/
    data/               Server-only read functions (Supabase queries → domain types)
    supabase/           Browser/server/middleware Supabase clients
    validations/        Zod schemas
    auth/require-admin.ts
    cost-estimate.ts    The transparent cost-breakdown calculator (pure function)
    site-config.ts      Business identity, contact info, nav — single source of truth
  types/
    database.ts         Hand-written Supabase types (see "Regenerating types" below)
    vehicle.ts           Domain/view types used by the UI
supabase/
  migrations/           Schema, RLS policies, storage bucket + policies
  seed.sql              Local dev seed data (lookup tables + 2 sample vehicles)
scripts/
  create-first-admin.ts  Provisions the first admin account (service role)
```

## Local development

### Prerequisites

- Node 20+, npm
- Docker Desktop (for the local Supabase stack)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)

### 1. Install dependencies

```bash
npm install
```

### 2. Start the local Supabase stack

```bash
supabase start
```

This applies every migration in `supabase/migrations/` and seeds `supabase/seed.sql`
(brands, body/fuel/transmission types, a sample shipping rate, 2 sample vehicles).

> Local ports are non-default in this project (see `supabase/config.toml`) to avoid
> clashing with other local Supabase projects on the same machine: API `55921`, DB
> `55922`, Studio `55923`. If you don't have other Supabase projects running locally,
> feel free to reset these to the CLI's defaults.

Copy the printed `anon key` and `service_role key` into `.env.local`:

```bash
cp .env.example .env.local
# then fill in NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
# from `supabase status`
```

### 3. Create the first admin account

```bash
SUPABASE_URL=http://127.0.0.1:55921 \
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_from_supabase_status> \
npm run db:seed:admin -- admin@srmotors.test "a-strong-local-password" "SR Motors Admin"
```

### 4. Run the app

```bash
npm run dev
```

The app runs on **http://localhost:3010** (port 3000 is commonly taken by other local
projects; change the `-p` flag in `package.json`'s `dev` script if you'd rather use
3000). Sign in at `/admin/login` (also linked as "Staff login" in the site footer) with
the account you just created.

Emails sent locally (e.g. enquiry alerts) are caught, not delivered — view them at
**http://127.0.0.1:55924**.

### 5. Run the end-to-end tests

```bash
npm run test:e2e
```

Drives your installed Google Chrome through the whole site and admin (login, exchange
rate, vehicle with photo upload, GHS prices, cost estimate totals, every filter,
customer enquiry → email alert → admin follow-up, calculator enquiry, archiving) and
fails on any uncaught browser error. It needs `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`
in `.env.local`, creates only `e2e-`/`E2E Buyer` test records, and deletes them before
and after each run. Run it after any significant change.

## Enquiry email alerts

Every enquiry (contact page, vehicle page, calculator) emails the addresses in
`ENQUIRY_ALERT_TO` right after it's saved, with the customer's details, the vehicle, and
one-tap **Reply on WhatsApp** / **Reply by Email** / **Open in Admin** buttons.

- **Production with Gmail:** turn on 2-Step Verification for srmotors@gmail.com, create an
  App Password (Google Account → Security → App passwords), then set `SMTP_HOST=smtp.gmail.com`,
  `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER=srmotors@gmail.com`, `SMTP_PASS=<app password>`.
- **Several staff:** comma-separate addresses in `ENQUIRY_ALERT_TO`.
- **If sending fails** the enquiry is still saved; the admin enquiry page shows
  "Staff email alert not sent: …" with the reason.
- **Abuse protection:** a hidden honeypot field plus a limit of 5 enquiries per IP per
  10 minutes, so the alerts can't be used to flood your inbox.
- WhatsApp *auto*-alerts would need the paid WhatsApp Business API, so they aren't
  built; the WhatsApp reply button opens a chat with the customer in one tap instead.

## Sample listings (temporary)

20 temporary listings across all 9 brands fill the homepage's Featured carousel while real
stock is being prepared:

```bash
npm run samples:seed     # add them (safe to re-run)
npm run samples:remove   # delete them all, with their photos
```

- They're defined in `scripts/sample-data/sample-vehicles.json`. Prices are illustrative
  FOB figures, not real stock.
- Every sample shows a **"Sample listing"** badge and says so in its description. Samples are
  `noindex` and excluded from the sitemap, so Google never lists them as real cars.
- Photos come from Wikimedia Commons under CC BY / CC BY-SA / CC0 licences. Each listing
  shows the required credit (author, licence, link) under the photo. Keep the credit if
  you reuse a photo.
- **Remove them before launch** (`npm run samples:remove` against production). Enquiries
  about a sample are kept; only the link to the vehicle is cleared.
- Each sample has a **gallery of 2–5 photos** (front, rear, side, interior or dashboard,
  depending on what freely licensed photos exist for that exact model). I only used
  interiors that show a **left-hand-drive** cabin, since that is what's imported to Ghana;
  right-hand-drive ones were rejected. Some models have fewer views simply because no
  suitable licensed photo exists, so real stock photos will always beat these.
- Their import-cost estimates are deliberately left "Not yet confirmed". No duty figures
  are invented.

## Vehicle photo galleries

Customers can swipe (phone), use the arrows or keyboard (desktop), tap a thumbnail, or open
a photo full screen, with a "3 / 5" counter and a label for each angle ("Rear view",
"Interior", …). Cards show how many photos a listing has.

**For real listings:** in Admin → Vehicles → edit → **Media**, upload every photo, then use
the dropdown under each one to say which angle it shows. A "Buyers expect" checklist ticks off
front, rear, side, interior and dashboard as you go. Reorder with the arrows; the first photo
is the main image on cards. Labels are saved as the photo's description, so they also help
search engines and screen readers. Aim for at least 6 photos: front, rear, both sides,
interior and dashboard.

## Duty estimates and AutoDutyChecker

AutoDutyChecker (https://autodutychecker.com) is the configured duty-estimation service.
It's an independent third-party estimator, and its calculator needs a sign-in, so it
can't be queried automatically. The site uses it in three ways:

- **Customers** see a "Check Ghana import duty" card on vehicle pages and the calculator,
  listing exactly what to enter there (make, model, year, engine cc, condition, purchase
  market). It's clearly labelled as not affiliated with SR Motors or Ghana Customs (GRA).
- **Admins** open it from the vehicle's Import Cost Estimate page, check the duty with
  SR Motors' AutoDutyChecker account, and click **Record AutoDutyChecker as the source**.
  That stamps the source and date and sets a 14-day review date; you then enter the figure.
- **Customers see where a figure came from**: the source, status, prepared date and
  assumptions, next to the standard disclaimer that Ghana Customs determines the final amount.

Change the service name or link, or hide it, under **Admin → Site Content → Duty Estimator Link**.

## Exchange rates and cedi prices

Admins enter rates under **Shipping & Customs → Exchange Rates** (rate, source, and the
rate's date are all required). The site then shows an indicative GHS figure beside every
non-GHS FOB price, and converts mixed USD/GHS cost estimates into a single GHS total,
always citing the rate, source and date used. Rates older than 14 days
(`MAX_RATE_AGE_DAYS` in `src/lib/exchange-rates.ts`) stop being used, and the site falls back
to "contact SR Motors to confirm the cedi equivalent", so a stale rate is never presented
as current.

## Performance and caching

Public pages read through a cookie-free, read-only database client and are cached
(regenerated at most every 5 minutes; the sitemap hourly). Any admin change clears the
cache immediately, so edits appear on the next visit. The session middleware only runs
on `/admin`. Lighthouse mobile scores on the local production build (simulated slow 4G):
performance 93–95, accessibility 100, best practices 100, SEO 100.

- **Deploy close to Ghana:** create the Supabase project in a European region (e.g.
  London / `eu-west-2`) and set the Vercel functions region to match. Cached pages are
  served from Vercel's CDN regardless, but uncached requests (search filters, admin)
  should travel the shortest path.
- **Body text uses the phone's own font** (Roboto on Android, San Francisco on iPhone)
  to save a ~38 KB download; headings keep Playfair Display. To restore the Geist body
  font, re-add it in `src/app/layout.tsx` with `variable: "--font-sans"` and remove the
  `--font-sans` line from `:root` in `globals.css`.
- **Photos:** upload reasonably sized JPEGs (≈2000 px wide is plenty). Next.js serves
  resized AVIF/WebP versions automatically, but smaller originals process faster.

## Regenerating database types

`src/types/database.ts` was hand-written to match the SQL in `supabase/migrations/`
(including embedded-relationship metadata so Supabase's query builder types resolve
correctly) because it was written before the local stack was healthy enough to run
codegen. Once your Supabase stack is up, you can regenerate the authoritative version:

```bash
npm run db:types
```

**Important:** the generated file won't include the convenience type aliases this
project imports elsewhere (`VehicleStatus`, `EnquiryStatus`, etc. — the generator nests
these under `Database["public"]["Enums"]`). If you regenerate, either re-add those
aliases at the top of the file or update the few files that import them directly
(`grep -rl 'from "@/types/database"' src`).

## Deploying

1. **Create a Supabase project** (supabase.com) and push the schema:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
   Run `scripts/create-first-admin.ts` against the hosted project the same way as
   locally, pointing `SUPABASE_URL` at your project URL.

2. **Deploy to Vercel**: import the repo, set the environment variables from
   `.env.example` (using your hosted Supabase project's URL/keys — never the local
   ones), set `NEXT_PUBLIC_SITE_URL` to your production domain, and fill in the SMTP /
   `ENQUIRY_ALERT_*` values (see "Enquiry email alerts"). Do **not** set
   `ALLOW_LOCAL_IMAGES` or any `E2E_*` variables in production.

3. **Storage**: the `media` bucket and its RLS policies are created by the migrations —
   nothing extra to configure in the Supabase dashboard.

4. **Google integrations**: once you have real IDs, set `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   and `GOOGLE_SITE_VERIFICATION` and wire them into `src/app/layout.tsx`'s metadata /
   add the GA4 script. Submit `/sitemap.xml` in Search Console after the domain is live.

## Replacing the logo

The official logo (`SR MOTORS LOGO.jpg`, on a black background) was cropped into three
working assets under `public/brand/`:
- `logo-lockup.png` — mark + wordmark, tagline cropped off (used in header/footer)
- `logo-mark.png` — the "SR" mark only (used in the admin sidebar)
- `icon-*.png`, `favicon.ico`, `src/app/icon.png`, `src/app/apple-icon.png` — generated
  from the mark, padded onto a brand-black square

If SR Motors later supplies a transparent-background or multi-format logo kit, replace
these files directly (keep the same filenames) rather than changing every reference.

## Known local-dev note

The local Supabase stack's Docker images are pulled from a public ECR registry that can
be rate-limited the first time you pull a large set of images on a given IP. If
`supabase start` seems stuck downloading, it will resume/retry on its own — this is a
one-time cost per machine (images are cached by Docker afterwards).

Supabase Studio and the analytics/log containers are disabled in `supabase/config.toml`
(`[studio]` / `[analytics]`) because their health checks repeatedly failed on this machine
and blocked `supabase start`. The site doesn't need them; re-enable them there if you
want the Studio database browser.
