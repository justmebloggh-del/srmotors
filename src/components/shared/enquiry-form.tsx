"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Type-only: the Zod schema itself stays on the server (it validates every
// submission there), which keeps it out of every visitor's JS download.
import type { EnquiryInput } from "@/lib/validations/enquiry";
import { submitEnquiry } from "@/app/actions/enquiries";

export function EnquiryForm({
  vehicleId,
  source = "contact_page",
  estimateReference,
  defaultMessage,
}: {
  vehicleId?: string;
  source?: EnquiryInput["source"];
  estimateReference?: string;
  defaultMessage?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<EnquiryInput>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      preferredContactMethod: "whatsapp",
      message: defaultMessage ?? "",
      companyWebsite: "",
    },
  });

  function onSubmit(values: EnquiryInput) {
    startTransition(async () => {
      // Context props are read at submit time, not baked into form defaults, so
      // a vehicle chosen after the form mounted (e.g. in the calculator) is sent.
      const result = await submitEnquiry({ ...values, vehicleId, estimateReference, source });
      if (result.ok) {
        setSubmitted(true);
        form.reset();
        toast.success("Enquiry sent — SR Motors will be in touch shortly.");
      } else {
        toast.error(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="rounded-sm border border-brand-gold/40 bg-brand-gold/5 p-6 text-center">
        <p className="font-semibold text-brand-charcoal">Thank you — your enquiry has been received.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          SR Motors will reach out using your preferred contact method shortly.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => setSubmitted(false)}>
          Send another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Honeypot — visually hidden, bots fill it, real users never do. */}
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="companyWebsite">Company Website</Label>
        <Input id="companyWebsite" tabIndex={-1} autoComplete="off" {...form.register("companyWebsite")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            autoComplete="name"
            {...form.register("name", {
              validate: (v) => v.trim().length >= 2 || "Please enter your name",
              maxLength: { value: 120, message: "Name is too long" },
            })}
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">Phone / WhatsApp</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            {...form.register("phone", {
              validate: (v, values) => {
                if (!v?.trim() && !values.email?.trim()) return "Add a phone number or email so we can reach you";
                if (v?.trim() && v.replace(/\D/g, "").length < 6) return "Enter a valid phone number";
                return true;
              },
            })}
          />
          {form.formState.errors.phone && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...form.register("email", {
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
              deps: ["phone"],
            })}
          />
          {form.formState.errors.email && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div>
          <Label>Preferred Contact Method</Label>
          <Select
            value={form.watch("preferredContactMethod")}
            onValueChange={(v) => form.setValue("preferredContactMethod", v as EnquiryInput["preferredContactMethod"])}
          >
            <SelectTrigger aria-label="Preferred contact method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone Call</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          rows={4}
          {...form.register("message", {
            validate: (v) => v.trim().length >= 10 || "Please add a few details",
            maxLength: { value: 2000, message: "Please keep your message under 2000 characters" },
          })}
        />
        {form.formState.errors.message && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.message.message}</p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="bg-brand-gold text-brand-black hover:bg-brand-gold-light">
        {pending ? "Sending…" : "Send Enquiry"}
      </Button>
    </form>
  );
}
