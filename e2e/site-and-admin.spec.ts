import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * End-to-end walkthrough against the local stack (supabase start + npm run dev).
 * Creates its own clearly-marked test data and removes it before and after.
 */

const stamp = Date.now().toString(36);
const SLUG = `e2e-toyota-${stamp}`;
const MODEL = `E2E Model ${stamp}`;
const BUYER = `E2E Buyer ${stamp}`;
const RATE_SOURCE = "E2E Test Rate";
const MAILPIT = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:55924";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@srmotors.test";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";
const TEST_IMAGE = path.join(process.cwd(), "public/brand/logo.jpg");

function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

async function cleanup() {
  const db = serviceClient();
  const { data: vehicles } = await db.from("vehicles").select("id").like("slug", "e2e-%");
  const ids = (vehicles ?? []).map((v) => v.id);
  if (ids.length) {
    const { data: links } = await db.from("vehicle_media").select("media_id").in("vehicle_id", ids);
    const mediaIds = (links ?? []).map((l) => l.media_id);
    await db.from("enquiries").delete().in("vehicle_id", ids);
    await db.from("vehicle_cost_estimates").delete().in("vehicle_id", ids);
    await db.from("vehicles").delete().in("id", ids);
    if (mediaIds.length) {
      const { data: media } = await db.from("media").select("id, storage_path").in("id", mediaIds);
      if (media?.length) {
        await db.storage.from("media").remove(media.map((m) => m.storage_path));
        await db.from("media").delete().in("id", mediaIds);
      }
    }
  }
  await db.from("enquiries").delete().like("name", "E2E Buyer%");
  await db.from("currency_rates").delete().eq("source", RATE_SOURCE);
}

/** Inputs in admin forms sit as siblings of a <label> without htmlFor. */
function fieldAfterLabel(page: Page, label: string) {
  return page.locator(`xpath=//label[normalize-space()="${label}"]/following-sibling::*[self::input or self::textarea][1]`);
}

async function pickOption(page: Page, trigger: string, option: string) {
  await page.getByRole("combobox", { name: trigger }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test.describe.configure({ mode: "serial" });

let page: Page;
let vehicleId = "";
const browserErrors: string[] = [];

test.beforeAll(async ({ browser }) => {
  expect(ADMIN_PASSWORD, "Set E2E_ADMIN_PASSWORD in .env.local").not.toBe("");
  await cleanup();
  page = await browser.newPage();
  page.on("pageerror", (err) => browserErrors.push(err.message));
});

test.afterAll(async () => {
  await page?.close();
  await cleanup();
});

test("homepage renders with staff login link in the footer", async () => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Find Your Next Car with Confidence");
  const staffLink = page.getByRole("link", { name: "Staff login" });
  await expect(staffLink).toHaveAttribute("href", "/admin/login");
});

test("homepage has no horizontal scroll on a phone-sized screen", async ({ browser }) => {
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto("/");
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await mobile.close();
});

test("admin login rejects a wrong password, then signs in", async () => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);

  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill("definitely-wrong");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByText("Invalid email or password.")).toBeVisible();

  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("admin adds a USD→GHS exchange rate", async () => {
  await page.goto("/admin/shipping");
  await fieldAfterLabel(page, "From").fill("USD");
  await fieldAfterLabel(page, "To").fill("GHS");
  await fieldAfterLabel(page, "Rate").fill("13.5");
  await fieldAfterLabel(page, "Source").fill(RATE_SOURCE);
  await page.getByRole("button", { name: "Add Rate" }).first().click();
  await expect(page.getByRole("listitem").filter({ hasText: RATE_SOURCE }).first()).toContainText("Current");
});

test("vehicle form shows field errors instead of failing silently", async () => {
  await page.goto("/admin/vehicles/new");
  await page.getByRole("tab", { name: "Pricing" }).click();
  await page.getByRole("button", { name: "Create Vehicle" }).click();
  await expect(page.getByText("FOB price must be greater than zero")).toBeVisible();
  await page.getByRole("tab", { name: "Basics" }).click();
  await expect(page.getByText("Select a brand")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/vehicles\/new/);
});

test("admin creates a published vehicle with a photo", async () => {
  await page.goto("/admin/vehicles/new");

  await pickOption(page, "Brand", "Toyota");
  await page.getByLabel("Model Name").fill(MODEL);
  await page.getByLabel("Trim / Variant").fill("GX");
  await page.getByLabel("Year").fill("2021");
  // Auto-slug: brand + model + trim + year + a short unique suffix, updated live.
  await expect(page.getByLabel(/URL Slug/)).toHaveValue(
    new RegExp(`^toyota-e2e-model-${stamp}-gx-2021-[a-z0-9]{6}$`),
  );
  await page.getByLabel(/URL Slug/).fill(SLUG);
  await page.getByLabel("Trim / Variant").fill("GX Premium");
  // Once edited by hand, the slug must not be overwritten.
  await expect(page.getByLabel(/URL Slug/)).toHaveValue(SLUG);

  await page.getByRole("tab", { name: "Specifications" }).click();
  await page.getByLabel("Mileage", { exact: true }).fill("30000");
  await pickOption(page, "Mileage unit", "Miles");
  await page.getByLabel("Engine Capacity (cc)").fill("2500");
  await pickOption(page, "Fuel type", "Petrol");
  await pickOption(page, "Transmission", "Automatic");
  await pickOption(page, "Body type", "SUV");
  await page.getByLabel("Source Country").fill("Japan");

  await page.getByRole("tab", { name: "Pricing" }).click();
  await page.getByLabel("FOB Price").fill("20000");
  await page.getByLabel("Currency").fill("USD");
  await pickOption(page, "Status", "Available");

  await page.getByRole("tab", { name: "Media" }).click();
  await page.locator('input[type="file"]').setInputFiles(TEST_IMAGE);
  await expect(page.getByText("Main", { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "Promote" }).click();
  await expect(page.locator("textarea[readonly]")).toHaveValue(new RegExp(`2021 Toyota ${MODEL}`));

  await page.getByRole("button", { name: "Create Vehicle" }).click();
  await expect(page).toHaveURL(/\/admin\/vehicles$/);

  const row = page.getByRole("row").filter({ hasText: `/${SLUG}` });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Vehicle actions" }).click();
  const editHref = await page.getByRole("menuitem", { name: "Edit" }).getAttribute("href");
  vehicleId = editHref!.split("/")[3];
  await page.keyboard.press("Escape");
  expect(vehicleId).toMatch(/^[0-9a-f-]{36}$/);
});

test("public listing shows the photo, FOB notice and an indicative cedi price", async () => {
  await page.goto(`/vehicles/${SLUG}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(MODEL);
  await expect(page.getByText(/listed vehicle price is FOB only/).first()).toBeVisible();
  // 20,000 USD × 13.5 = 270,000 GHS
  await expect(page.getByText(/270,000/).first()).toBeVisible();
  await expect(page.getByText(new RegExp(RATE_SOURCE)).first()).toBeVisible();

  // The uploaded photo must actually load through Next's image optimiser.
  await expect
    .poll(async () =>
      page.evaluate(() =>
        Array.from(document.images).some(
          (img) => img.src.includes("_next/image") && img.src.includes("storage") && img.complete && img.naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
});

test("admin cost estimate produces a GHS total on the listing", async () => {
  await page.goto(`/admin/vehicles/${vehicleId}/estimate`);
  await fieldAfterLabel(page, "Shipping Amount").fill("1500");
  await fieldAfterLabel(page, "Customs Duty Amount").fill("60000");
  await fieldAfterLabel(page, "Port Charges").fill("4000");
  await fieldAfterLabel(page, "Clearing Fees").fill("3000");
  await fieldAfterLabel(page, "Local Transport").fill("1000");
  // The admin opens AutoDutyChecker (third-party, login required), then records it as the source.
  await expect(page.getByRole("link", { name: /Open AutoDutyChecker/ })).toHaveAttribute(
    "href",
    "https://autodutychecker.com/calculator/search-mode/",
  );
  await page.getByRole("button", { name: "Record AutoDutyChecker as the source" }).click();
  await expect(fieldAfterLabel(page, "Customs Calculation Method / Source")).toHaveValue(
    /^AutoDutyChecker third-party estimate, checked .+ not an official GRA assessment\.$/,
  );
  await page.getByRole("button", { name: "Save New Estimate Version" }).click();
  await expect(page.getByText("preliminary", { exact: true }).first()).toBeVisible();

  await page.goto(`/vehicles/${SLUG}`);
  // (20,000 + 1,500) × 13.5 + 60,000 + 4,000 + 3,000 + 1,000 = 358,250 GHS
  const total = page.locator("div").filter({ has: page.getByText("Estimated Total", { exact: true }) }).last();
  await expect(total).toContainText("358,250");
  // Provenance is shown to customers alongside the figures.
  await expect(page.getByText(/Duty estimate source:/)).toBeVisible();
  await expect(page.getByText(/AutoDutyChecker third-party estimate, checked/).first()).toBeVisible();

  // Duty checker card lists exactly what to enter on the third-party site.
  const dutyCard = page.getByRole("region", { name: "Check Ghana import duty" });
  await expect(dutyCard).toContainText("not affiliated with SR Motors or Ghana Customs");
  await expect(dutyCard).toContainText("2,500 cc (2.5L)");
  await expect(dutyCard).toContainText("Japan");
  await expect(dutyCard.getByRole("link", { name: /Open AutoDutyChecker/ })).toHaveAttribute("target", "_blank");
});

test("brands page shows each brand's starting FOB price", async () => {
  await page.goto("/brands");
  const toyota = page.getByRole("link").filter({ hasText: /^Toyota/ });
  await expect(toyota).toContainText(/from US\$[\d,]+/);
  await expect(toyota).toContainText(/\d+ available/);
});

test("new filters: model, mileage (miles converted to km), engine size, source country", async () => {
  const count = async (query: string) => {
    await page.goto(`/vehicles?${query}`);
    return page.getByRole("heading", { level: 3, name: new RegExp(MODEL) }).count();
  };
  const model = `model=${encodeURIComponent(MODEL)}`;

  expect(await count(model)).toBe(1);
  // 30,000 miles ≈ 48,280 km
  expect(await count(`${model}&mileageMax=40000`)).toBe(0);
  expect(await count(`${model}&mileageMax=50000`)).toBe(1);
  expect(await count(`${model}&engineMin=2.4&engineMax=2.6`)).toBe(1);
  expect(await count(`${model}&engineMax=2.0`)).toBe(0);
  expect(await count(`${model}&sourceCountry=Japan`)).toBe(1);

  // Model checkboxes appear once a brand is chosen in the sidebar.
  await page.goto("/vehicles");
  await page.getByRole("checkbox").locator("xpath=..").filter({ hasText: /^Toyota$/ }).click();
  await expect(page).toHaveURL(/brand=toyota/);
  await page.locator("label").filter({ hasText: MODEL }).click();
  await expect(page).toHaveURL(/model=/);
  await expect(page.getByRole("heading", { level: 3, name: new RegExp(MODEL) })).toBeVisible();
});

test("customer enquiry triggers a staff email alert and appears in the admin inbox", async ({ browser }) => {
  const customer = await browser.newPage(); // signed out, like a real visitor
  await customer.goto(`/vehicles/${SLUG}`);
  await customer.getByLabel("Full Name").fill(BUYER);
  await customer.getByLabel("Phone / WhatsApp").fill("0244 123 456");
  await customer.getByLabel("Email").fill("buyer@example.com");
  await customer.getByRole("button", { name: "Send Enquiry" }).click();
  await expect(customer.getByText("your enquiry has been received")).toBeVisible();
  await customer.close();

  await expect
    .poll(
      async () => {
        const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`subject:"${BUYER}"`)}`);
        const json = (await res.json()) as { messages?: { ID: string }[] };
        return json.messages?.[0]?.ID ?? null;
      },
      { timeout: 20_000 },
    )
    .not.toBeNull();

  const search = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`subject:"${BUYER}"`)}`);
  const { messages } = (await search.json()) as { messages: { ID: string }[] };
  const message = await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json();
  expect(message.Subject).toContain(MODEL);
  // Local "0244 123 456" becomes the international WhatsApp number.
  expect(message.HTML).toContain("wa.me/233244123456");
  expect(message.To[0].Address).toBe("srmotors@gmail.com");

  await page.goto("/admin/enquiries");
  await page.getByRole("link", { name: new RegExp(BUYER) }).click();
  await expect(page.getByText(/Staff email alert sent/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Reply on WhatsApp" })).toHaveAttribute(
    "href",
    /wa\.me\/233244123456/,
  );

  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "contacted" }).click();
  await expect(page.getByText("Status updated")).toBeVisible();

  await page.getByPlaceholder("Add an internal note…").fill("Called buyer, sending inspection video.");
  await page.getByRole("button", { name: "Add Note" }).click();
  await expect(page.getByText("Called buyer, sending inspection video.")).toBeVisible();
});

test("calculator enquiry keeps the chosen vehicle and estimate reference", async ({ browser }) => {
  const customer = await browser.newPage();
  await customer.goto(`/import-calculator?vehicle=${SLUG}`);
  await expect(customer.getByText(/Reference: SRM-EST-/).first()).toBeVisible();
  const reference = (await customer.getByText(/Reference: SRM-EST-/).first().textContent())!.match(/SRM-EST-[A-Z0-9-]+/)![0];
  await expect(customer.getByLabel("Message")).toHaveValue(new RegExp(MODEL));

  await customer.getByLabel("Full Name").fill(`${BUYER} calc`);
  await customer.getByLabel("Phone / WhatsApp").fill("0201234567");
  await customer.getByRole("button", { name: "Send Enquiry" }).click();
  await expect(customer.getByText("your enquiry has been received")).toBeVisible();
  await customer.close();

  const { data } = await serviceClient()
    .from("enquiries")
    .select("vehicle_id, estimate_reference, source")
    .eq("name", `${BUYER} calc`)
    .single();
  expect(data).toEqual({ vehicle_id: vehicleId, estimate_reference: reference, source: "calculator" });
});

test("photo gallery: swipe, arrows, thumbnails and full-screen on a phone and desktop", async ({ browser }) => {
  const { data: media } = await serviceClient().from("media").select("id, storage_path").like("storage_path", "samples/%").limit(1);
  test.skip(!media?.length, "sample vehicles not seeded (npm run samples:seed)");

  // Phone: the page must not be wider than the screen (a wide thumbnail strip used to force that).
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await phone.goto("/vehicles/sample-bmw-x5-2020-s14");
  const region = phone.getByRole("region", { name: /photos/ });
  expect(await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await expect(region.getByText("1 / 5")).toBeVisible();
  // A swipe is a native horizontal scroll of the track; the counter must follow it.
  await region.locator("div").first().evaluate((el) => el.scrollTo({ left: el.clientWidth * 3, behavior: "instant" }));
  await expect(region.getByText("4 / 5")).toBeVisible();
  await expect(region.getByText("Interior")).toBeVisible();
  await phone.close();

  // Desktop: arrows, thumbnails, labelled views, full screen with keyboard.
  await page.goto("/vehicles/sample-bmw-x5-2020-s14");
  const gallery = page.getByRole("region", { name: /photos/ });
  await gallery.getByRole("button", { name: "Next photo" }).click();
  await expect(gallery.getByText("2 / 5")).toBeVisible();
  await expect(gallery.getByText("Rear view")).toBeVisible();
  await page.getByRole("button", { name: /Show photo 5/ }).click();
  await expect(gallery.getByText("5 / 5")).toBeVisible();
  await gallery.getByRole("button", { name: "View full screen" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("5 / 5");
  // The title alone isn't proof: the photo on screen must actually be the 5th one.
  const visibleSlide = () =>
    dialog.locator("div.snap-x").evaluate((el) => Math.round(el.scrollLeft / el.clientWidth));
  await expect.poll(visibleSlide).toBe(4);
  await page.keyboard.press("ArrowLeft");
  await expect(dialog).toContainText("4 / 5");
  await expect.poll(visibleSlide).toBe(3);
  await page.keyboard.press("Escape");
  await expect(gallery.getByText("4 / 5")).toBeVisible();

  // Listing cards advertise the extra photos.
  await page.goto("/vehicles?brand=bmw");
  await expect(page.getByText("5 photos").first()).toBeVisible();
});

test("archiving a vehicle removes it from the public site", async () => {
  await page.goto("/admin/vehicles");
  const row = page.getByRole("row").filter({ hasText: `/${SLUG}` });
  await row.getByRole("button", { name: "Vehicle actions" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("menuitem", { name: "Archive" }).click();
  await expect(page.getByText("Vehicle archived")).toBeVisible();

  const response = await page.goto(`/vehicles/${SLUG}`);
  expect(response?.status()).toBe(404);
});

test("no uncaught errors in the browser during the whole run", async () => {
  expect(browserErrors).toEqual([]);
});
