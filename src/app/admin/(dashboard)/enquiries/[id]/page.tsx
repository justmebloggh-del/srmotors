import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminEnquiryById } from "@/lib/data/admin-enquiries";
import { EnquiryDetailPanel } from "@/components/admin/enquiry-detail-panel";
import { toWhatsAppDigits } from "@/lib/phone";

export default async function AdminEnquiryDetailPage({
  params,
}: PageProps<"/admin/enquiries/[id]">) {
  const { id } = await params;
  const enquiry = await getAdminEnquiryById(id);
  if (!enquiry) notFound();

  const vehicle = (
    enquiry as {
      vehicles?: {
        slug: string;
        year: number;
        brands?: { name: string };
        vehicle_models?: { name: string };
        model_name_override?: string | null;
      } | null;
    }
  ).vehicles;
  const notes = (enquiry as { enquiry_notes?: { id: string; note: string; created_at: string }[] }).enquiry_notes ?? [];
  const waDigits = toWhatsAppDigits(enquiry.phone);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-2xl font-bold">{enquiry.name}</h1>
        <p className="text-sm text-muted-foreground">
          {enquiry.email} {enquiry.phone && `· ${enquiry.phone}`} · Prefers {enquiry.preferred_contact_method}
        </p>

        {vehicle && (
          <Link href={`/vehicles/${vehicle.slug}`} target="_blank" className="mt-2 inline-block text-sm text-brand-gold hover:underline">
            Re: {vehicle.year} {vehicle.brands?.name} {vehicle.vehicle_models?.name ?? vehicle.model_name_override}
          </Link>
        )}

        <p className="mt-2 text-xs text-muted-foreground">
          {enquiry.alert_sent_at
            ? `Staff email alert sent ${new Date(enquiry.alert_sent_at).toLocaleString("en-GB")}`
            : enquiry.alert_error
              ? `Staff email alert not sent: ${enquiry.alert_error}`
              : "Staff email alert pending"}
        </p>

        <div className="mt-6 rounded-sm border border-border p-4">
          <h2 className="mb-2 text-sm font-semibold">Message</h2>
          <p className="whitespace-pre-line text-sm">{enquiry.message}</p>
        </div>

        {enquiry.estimate_reference && (
          <p className="mt-3 text-xs text-muted-foreground">Estimate reference: {enquiry.estimate_reference}</p>
        )}

        <div className="mt-6 flex gap-3">
          {waDigits && (
            <a
              href={`https://wa.me/${waDigits}?text=${encodeURIComponent(`Hi ${enquiry.name}, thanks for reaching out to SR Motors.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm bg-[#25D366] px-4 py-2 text-sm font-medium text-brand-black"
            >
              Reply on WhatsApp
            </a>
          )}
          {enquiry.email && (
            <a
              href={`mailto:${enquiry.email}`}
              className="rounded-sm border border-border px-4 py-2 text-sm font-medium"
            >
              Reply by Email
            </a>
          )}
        </div>
      </div>

      <EnquiryDetailPanel
        id={enquiry.id}
        status={enquiry.status}
        followUpDate={enquiry.follow_up_date}
        notes={notes.map((n) => ({ id: n.id, note: n.note, createdAt: n.created_at }))}
      />
    </div>
  );
}
