import { z } from "zod";

export const enquirySchema = z.object({
  vehicleId: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(30).optional().or(z.literal("")),
  preferredContactMethod: z.enum(["whatsapp", "email", "phone"]).default("whatsapp"),
  message: z.string().trim().min(10, "Please add a few details").max(2000),
  source: z.enum(["vehicle_page", "contact_page", "calculator", "other"]).default("other"),
  estimateReference: z.string().trim().max(60).optional(),
  // Honeypot field — real users never fill this in; bots usually do. Left
  // unconstrained here so a filled value still parses — the action layer
  // checks it and silently no-ops instead of tipping the bot off.
  companyWebsite: z.string().optional().or(z.literal("")),
}).refine((data) => data.email || data.phone, {
  message: "Provide at least an email or phone number so we can reach you",
  path: ["email"],
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
