import "server-only";
import nodemailer from "nodemailer";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site-config";
import { toWhatsAppDigits } from "@/lib/phone";

function smtpConfig() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, ENQUIRY_ALERT_TO, ENQUIRY_ALERT_FROM } =
    process.env;
  if (!SMTP_HOST || !ENQUIRY_ALERT_TO) return null;

  return {
    transport: {
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: SMTP_SECURE === "true",
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    },
    to: ENQUIRY_ALERT_TO.split(",").map((s) => s.trim()).filter(Boolean),
    from: ENQUIRY_ALERT_FROM ?? SMTP_USER ?? `alerts@${new URL(siteConfig.url).hostname}`,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Emails SR Motors staff about a new enquiry and records the outcome on the
 * enquiry row (alert_sent_at / alert_error) so failures show up in the admin
 * instead of being silently lost. Never throws — a failed alert must not
 * affect the customer's submission, which is already saved.
 */
export async function sendEnquiryAlert(enquiryId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const config = smtpConfig();

  const record = async (fields: { alert_sent_at?: string; alert_error?: string | null }) => {
    await supabase.from("enquiries").update(fields).eq("id", enquiryId);
  };

  if (!config) {
    console.warn("Enquiry alert skipped: SMTP_HOST / ENQUIRY_ALERT_TO not configured");
    await record({ alert_error: "Email alerts not configured" });
    return;
  }

  try {
    const { data: e, error } = await supabase
      .from("enquiries")
      .select(
        "id, name, email, phone, preferred_contact_method, message, source, estimate_reference, created_at, vehicles ( slug, year, brands ( name ), vehicle_models ( name ), model_name_override )",
      )
      .eq("id", enquiryId)
      .single();
    if (error || !e) throw error ?? new Error("Enquiry not found");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = (e as any).vehicles as
      | { slug: string; year: number; brands?: { name: string }; vehicle_models?: { name: string }; model_name_override?: string }
      | null;
    const vehicleTitle = v
      ? `${v.year} ${v.brands?.name ?? ""} ${v.vehicle_models?.name ?? v.model_name_override ?? ""}`.replace(/\s+/g, " ").trim()
      : null;

    const adminUrl = `${siteConfig.url}/admin/enquiries/${e.id}`;
    const vehicleUrl = v ? `${siteConfig.url}/vehicles/${v.slug}` : null;
    const waDigits = toWhatsAppDigits(e.phone);
    const waReply = waDigits
      ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
          `Hello ${e.name}, thank you for contacting SR Motors${vehicleTitle ? ` about the ${vehicleTitle}` : ""}.`,
        )}`
      : null;

    const subject = `New enquiry: ${e.name}${vehicleTitle ? ` — ${vehicleTitle}` : ""}`;

    const rows: [string, string | null][] = [
      ["Name", e.name],
      ["Phone", e.phone],
      ["Email", e.email],
      ["Prefers", e.preferred_contact_method],
      ["Vehicle", vehicleTitle],
      ["Estimate ref", e.estimate_reference],
      ["Received", new Date(e.created_at).toLocaleString("en-GB", { timeZone: "Africa/Accra" })],
    ];

    const text = [
      subject,
      "",
      ...rows.filter(([, val]) => val).map(([k, val]) => `${k}: ${val}`),
      "",
      "Message:",
      e.message,
      "",
      `Open in admin: ${adminUrl}`,
      vehicleUrl ? `Listing: ${vehicleUrl}` : "",
      waReply ? `Reply on WhatsApp: ${waReply}` : "",
    ]
      .filter((line) => line !== null)
      .join("\n");

    const button = (href: string, label: string, bg: string, fg = "#ffffff") =>
      `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 16px;background:${bg};color:${fg};text-decoration:none;border-radius:4px;font-weight:600;font-size:14px">${escapeHtml(label)}</a>`;

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#101114">
        <div style="background:#101114;padding:16px 20px">
          <span style="color:#D6B46A;font-weight:700;letter-spacing:1px">SR MOTORS</span>
          <span style="color:#A6A6A6;font-size:13px"> · New enquiry</span>
        </div>
        <div style="padding:20px;border:1px solid #e5e3dd;border-top:0">
          <table style="border-collapse:collapse;font-size:14px;width:100%">
            ${rows
              .filter(([, val]) => val)
              .map(
                ([k, val]) =>
                  `<tr><td style="padding:4px 12px 4px 0;color:#6b6b6b;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:4px 0">${escapeHtml(String(val))}</td></tr>`,
              )
              .join("")}
          </table>
          <p style="margin:16px 0 4px;color:#6b6b6b;font-size:13px">Message</p>
          <p style="margin:0 0 20px;white-space:pre-line;font-size:14px">${escapeHtml(e.message)}</p>
          ${waReply ? button(waReply, "Reply on WhatsApp", "#25D366") : ""}
          ${e.email ? button(`mailto:${e.email}`, "Reply by Email", "#202124") : ""}
          ${button(adminUrl, "Open in Admin", "#D6B46A", "#101114")}
          ${vehicleUrl ? `<p style="font-size:13px;margin-top:12px">Listing: <a href="${escapeHtml(vehicleUrl)}">${escapeHtml(vehicleUrl)}</a></p>` : ""}
        </div>
      </div>`;

    const transporter = nodemailer.createTransport(config.transport);
    await transporter.sendMail({
      from: config.from,
      to: config.to,
      replyTo: e.email || undefined,
      subject,
      text,
      html,
    });

    await record({ alert_sent_at: new Date().toISOString(), alert_error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Enquiry alert failed", enquiryId, message);
    await record({ alert_error: message.slice(0, 500) });
  }
}
