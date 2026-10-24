import { z } from "zod";

export const vehicleStatusEnum = z.enum(["draft", "available", "reserved", "sold", "archived"]);
export const vehicleConditionEnum = z.enum(["new", "used", "certified_pre_owned"]);
export const drivetrainEnum = z.enum(["fwd", "rwd", "awd", "four_wd"]);
export const steeringEnum = z.enum(["lhd", "rhd"]);
export const mileageUnitEnum = z.enum(["km", "miles"]);

export const vehicleFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only"),
  brandId: z.string().uuid("Select a brand"),
  modelId: z.string().uuid().optional().nullable(),
  modelNameOverride: z.string().trim().max(80).optional().nullable(),
  trim: z.string().trim().max(80).optional().nullable(),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),

  mileageValue: z.coerce.number().min(0).optional().nullable(),
  mileageUnit: mileageUnitEnum.default("km"),

  fuelTypeId: z.string().uuid().optional().nullable(),
  transmissionId: z.string().uuid().optional().nullable(),
  engineCapacityCc: z.coerce.number().int().min(0).optional().nullable(),
  bodyTypeId: z.string().uuid().optional().nullable(),
  drivetrain: drivetrainEnum.optional().nullable(),
  steering: steeringEnum.optional().nullable(),
  condition: vehicleConditionEnum.default("used"),
  sourceCountry: z.string().trim().max(80).optional().nullable(),
  location: z.string().trim().max(120).optional().nullable(),
  cbm: z.coerce.number().min(0).max(200).optional().nullable(),

  fobAmount: z.coerce.number().positive("FOB price must be greater than zero"),
  fobCurrency: z.string().trim().length(3, "Use a 3-letter ISO currency code").toUpperCase(),
  priceNotes: z.string().trim().max(500).optional().nullable(),

  status: vehicleStatusEnum.default("draft"),
  featured: z.boolean().default(false),

  description: z.string().trim().max(5000).optional().nullable(),
  conditionNotes: z.string().trim().max(2000).optional().nullable(),

  seoTitle: z.string().trim().max(160).optional().nullable(),
  seoDescription: z.string().trim().max(300).optional().nullable(),
});

/** Validated values (numbers coerced) — what the server actions receive. */
export type VehicleFormInput = z.output<typeof vehicleFormSchema>;
/** Raw form state before coercion (number inputs may still hold strings). */
export type VehicleFormValues = z.input<typeof vehicleFormSchema>;

export const vehicleCostEstimateSchema = z.object({
  vehicleId: z.string().uuid(),
  status: z.enum(["unavailable", "preliminary", "reviewed", "expired"]),
  shippingRateId: z.string().uuid().optional().nullable(),
  shippingAmount: z.coerce.number().min(0).optional().nullable(),
  shippingCurrency: z.string().trim().length(3).toUpperCase().optional().nullable(),
  customsDutyAmount: z.coerce.number().min(0).optional().nullable(),
  customsCurrency: z.string().trim().length(3).toUpperCase().optional().nullable(),
  customsMethod: z.string().trim().max(500).optional().nullable(),
  portChargesAmount: z.coerce.number().min(0).optional().nullable(),
  clearingFeesAmount: z.coerce.number().min(0).optional().nullable(),
  localTransportAmount: z.coerce.number().min(0).optional().nullable(),
  otherChargesAmount: z.coerce.number().min(0).optional().nullable(),
  otherChargesDescription: z.string().trim().max(200).optional().nullable(),
  assumptions: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  reviewDueAt: z.string().datetime().optional().nullable(),
});

export type VehicleCostEstimateInput = z.infer<typeof vehicleCostEstimateSchema>;
