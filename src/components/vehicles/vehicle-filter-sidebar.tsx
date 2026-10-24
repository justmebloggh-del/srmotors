"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Taxonomy } from "@/lib/data/taxonomies";
import type { VehicleFacets } from "@/lib/data/vehicles";

const CONDITIONS: { value: string; label: string }[] = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
  { value: "certified_pre_owned", label: "Certified Pre-Owned" },
];

const AVAILABILITY: { value: string; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
];

function Group({
  title,
  param,
  options,
  selected,
  onToggle,
}: {
  title: string;
  param: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (param: string, value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={selected.includes(opt.value)}
              onCheckedChange={() => onToggle(param, opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export function VehicleFilterSidebar({
  brands,
  bodyTypes,
  fuelTypes,
  transmissionTypes,
  facets,
}: {
  brands: Taxonomy[];
  bodyTypes: Taxonomy[];
  fuelTypes: Taxonomy[];
  transmissionTypes: Taxonomy[];
  facets: VehicleFacets;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getSelected = useCallback(
    (param: string) => (searchParams.get(param)?.split(",").filter(Boolean) ?? []),
    [searchParams],
  );

  const updateParams = useCallback(
    (mutator: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutator(params);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const toggle = useCallback(
    (param: string, value: string) => {
      updateParams((params) => {
        const current = params.get(param)?.split(",").filter(Boolean) ?? [];
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        if (next.length) params.set(param, next.join(","));
        else params.delete(param);
        // A model chosen under one brand rarely exists under another.
        if (param === "brand") params.delete("model");
      });
    },
    [updateParams],
  );

  const selectedBrands = getSelected("brand");
  const modelOptions = facets.models
    .filter((m) => selectedBrands.length === 0 || selectedBrands.includes(m.brandSlug))
    .map((m) => ({ value: m.name, label: m.name }))
    .filter((opt, idx, arr) => arr.findIndex((o) => o.value === opt.value) === idx);

  function handleRangeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    updateParams((params) => {
      for (const key of ["yearMin", "yearMax", "priceMin", "priceMax", "mileageMax", "engineMin", "engineMax"]) {
        const value = form.get(key)?.toString().trim();
        if (value) params.set(key, value);
        else params.delete(key);
      }
    });
  }

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          Clear all
        </Button>
      </div>

      <Separator />

      <Group
        title="Manufacturer"
        param="brand"
        options={brands.map((b) => ({ value: b.slug, label: b.name }))}
        selected={getSelected("brand")}
        onToggle={toggle}
      />
      {modelOptions.length > 0 && (
        <>
          <Separator />
          <div className="max-h-64 overflow-y-auto">
            <Group
              title="Model"
              param="model"
              options={modelOptions}
              selected={getSelected("model")}
              onToggle={toggle}
            />
          </div>
        </>
      )}
      <Separator />
      <Group
        title="Body Type"
        param="bodyType"
        options={bodyTypes.map((b) => ({ value: b.slug, label: b.name }))}
        selected={getSelected("bodyType")}
        onToggle={toggle}
      />
      <Separator />
      <Group
        title="Fuel Type"
        param="fuelType"
        options={fuelTypes.map((f) => ({ value: f.slug, label: f.name }))}
        selected={getSelected("fuelType")}
        onToggle={toggle}
      />
      <Separator />
      <Group
        title="Transmission"
        param="transmission"
        options={transmissionTypes.map((t) => ({ value: t.slug, label: t.name }))}
        selected={getSelected("transmission")}
        onToggle={toggle}
      />
      <Separator />
      <Group
        title="Condition"
        param="condition"
        options={CONDITIONS}
        selected={getSelected("condition")}
        onToggle={toggle}
      />
      <Separator />
      <Group
        title="Availability"
        param="availability"
        options={AVAILABILITY}
        selected={getSelected("availability")}
        onToggle={toggle}
      />
      {facets.sourceCountries.length > 0 && (
        <>
          <Separator />
          <Group
            title="Source Country"
            param="sourceCountry"
            options={facets.sourceCountries.map((c) => ({ value: c, label: c }))}
            selected={getSelected("sourceCountry")}
            onToggle={toggle}
          />
        </>
      )}
      <Separator />

      <form onSubmit={handleRangeSubmit} className="space-y-4">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Year</h3>
          <div className="flex items-center gap-2">
            <Input name="yearMin" type="number" placeholder="Min" defaultValue={searchParams.get("yearMin") ?? ""} />
            <span className="text-muted-foreground">–</span>
            <Input name="yearMax" type="number" placeholder="Max" defaultValue={searchParams.get("yearMax") ?? ""} />
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Price (USD)</h3>
          <div className="flex items-center gap-2">
            <Input name="priceMin" type="number" placeholder="Min" defaultValue={searchParams.get("priceMin") ?? ""} />
            <span className="text-muted-foreground">–</span>
            <Input name="priceMax" type="number" placeholder="Max" defaultValue={searchParams.get("priceMax") ?? ""} />
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Max Mileage (km)</h3>
          <Input
            name="mileageMax"
            type="number"
            min={0}
            step={1000}
            placeholder="e.g. 80000"
            defaultValue={searchParams.get("mileageMax") ?? ""}
          />
          <p className="mt-1 text-xs text-muted-foreground">Listings in miles are converted automatically.</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Engine Size (litres)</h3>
          <div className="flex items-center gap-2">
            <Input name="engineMin" type="number" step="0.1" min={0} placeholder="Min" defaultValue={searchParams.get("engineMin") ?? ""} />
            <span className="text-muted-foreground">–</span>
            <Input name="engineMax" type="number" step="0.1" min={0} placeholder="Max" defaultValue={searchParams.get("engineMax") ?? ""} />
          </div>
        </div>
        <Button type="submit" variant="outline" size="sm" className="w-full">
          Apply
        </Button>
      </form>
    </aside>
  );
}
