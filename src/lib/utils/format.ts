export function formatMileage(value: number | null, unit: "km" | "miles"): string {
  if (value == null) return "—";
  return `${Math.round(value).toLocaleString()} ${unit}`;
}

export function formatEngine(cc: number | null): string {
  if (cc == null) return "—";
  return `${(cc / 1000).toFixed(1)}L`;
}

export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function titleCase(value: string): string {
  return value
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  archived: "Archived",
};

export function statusLabel(status: string): string {
  return statusLabels[status] ?? titleCase(status);
}

const conditionLabels: Record<string, string> = {
  new: "New",
  used: "Used",
  certified_pre_owned: "Certified Pre-Owned",
};

export function conditionLabel(condition: string): string {
  return conditionLabels[condition] ?? titleCase(condition);
}

const drivetrainLabels: Record<string, string> = {
  fwd: "FWD",
  rwd: "RWD",
  awd: "AWD",
  four_wd: "4WD",
};

export function drivetrainLabel(drivetrain: string | null): string {
  if (!drivetrain) return "—";
  return drivetrainLabels[drivetrain] ?? titleCase(drivetrain);
}

const steeringLabels: Record<string, string> = {
  lhd: "Left-Hand Drive",
  rhd: "Right-Hand Drive",
};

export function steeringLabel(steering: string | null): string {
  if (!steering) return "—";
  return steeringLabels[steering] ?? titleCase(steering);
}
