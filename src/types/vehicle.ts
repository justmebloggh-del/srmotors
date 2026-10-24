export type VehicleStatus = "draft" | "available" | "reserved" | "sold" | "archived";
export type VehicleCondition = "new" | "used" | "certified_pre_owned";
export type Drivetrain = "fwd" | "rwd" | "awd" | "four_wd";
export type Steering = "lhd" | "rhd";
export type MileageUnit = "km" | "miles";
export type EstimateStatus = "unavailable" | "preliminary" | "reviewed" | "expired";

export interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  altText: string | null;
  /** Photo credit / licence line, shown under the gallery image when present. */
  caption: string | null;
  position: number;
}

export interface VehicleCostEstimate {
  id: string;
  status: EstimateStatus;
  shippingAmount: number | null;
  shippingCurrency: string | null;
  customsDutyAmount: number | null;
  customsCurrency: string | null;
  customsMethod: string | null;
  portChargesAmount: number | null;
  clearingFeesAmount: number | null;
  localTransportAmount: number | null;
  otherChargesAmount: number | null;
  otherChargesDescription: string | null;
  assumptions: string | null;
  notes: string | null;
  calculatedAt: string;
  reviewDueAt: string | null;
}

export interface VehicleListItem {
  id: string;
  slug: string;
  brand: string;
  model: string;
  trim: string | null;
  year: number;
  mileageValue: number | null;
  mileageUnit: MileageUnit;
  fuelType: string | null;
  transmission: string | null;
  engineCapacityCc: number | null;
  bodyType: string | null;
  condition: VehicleCondition;
  sourceCountry: string | null;
  fobAmount: number;
  fobCurrency: string;
  status: VehicleStatus;
  featured: boolean;
  mainImageUrl: string | null;
  photoCount: number;
  createdAt: string;
  /** Indicative GHS equivalent of the FOB price; null when no current rate exists. */
  ghsApprox: { amount: number; rateNote: string } | null;
  /** Temporary demo listing (slug starts with "sample-"), shown with a visible badge. */
  isSample: boolean;
}

export interface VehicleDetail extends VehicleListItem {
  brandId: string;
  drivetrain: Drivetrain | null;
  steering: Steering | null;
  location: string | null;
  cbm: number | null;
  description: string | null;
  conditionNotes: string | null;
  priceNotes: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  media: MediaItem[];
  latestEstimate: VehicleCostEstimate | null;
  updatedAt: string;
  publishedAt: string | null;
}

export interface VehicleFilters {
  brand?: string[];
  model?: string[];
  mileageMaxKm?: number;
  engineMinCc?: number;
  engineMaxCc?: number;
  bodyType?: string[];
  fuelType?: string[];
  transmission?: string[];
  condition?: VehicleCondition[];
  sourceCountry?: string[];
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  featured?: boolean;
  status?: VehicleStatus[];
  q?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "year_desc";
  page?: number;
  perPage?: number;
}
