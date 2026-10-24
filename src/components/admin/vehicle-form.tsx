"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleMediaUploader, type GalleryItem } from "@/components/admin/vehicle-media-uploader";
import { SocialPostGenerator } from "@/components/admin/social-post-generator";
import { conditionLabel as formatConditionLabel } from "@/lib/utils/format";
import { vehicleFormSchema, type VehicleFormInput, type VehicleFormValues } from "@/lib/validations/vehicle";
import { createVehicleAction, updateVehicleAction } from "@/app/actions/vehicles";
import type { Taxonomy } from "@/lib/data/taxonomies";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function VehicleForm({
  vehicleId,
  defaultValues,
  defaultGallery = [],
  brands,
  bodyTypes,
  fuelTypes,
  transmissionTypes,
}: {
  vehicleId?: string;
  defaultValues?: Partial<VehicleFormValues>;
  defaultGallery?: GalleryItem[];
  brands: Taxonomy[];
  bodyTypes: Taxonomy[];
  fuelTypes: Taxonomy[];
  transmissionTypes: Taxonomy[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [gallery, setGallery] = useState<GalleryItem[]>(defaultGallery);
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug));

  const form = useForm<VehicleFormValues, unknown, VehicleFormInput>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      slug: "",
      brandId: "",
      year: new Date().getFullYear(),
      mileageUnit: "km",
      condition: "used",
      fobCurrency: "USD",
      status: "draft",
      featured: false,
      ...defaultValues,
    },
  });

  // Stable per new listing, so the URL stays unique even for identical make/model/year.
  const [slugSuffix] = useState(() => Math.random().toString(36).slice(2, 8));
  const [brandId, modelName, trimValue, yearValue] = form.watch(["brandId", "modelNameOverride", "trim", "year"]);

  // Derived live from the title fields (never on blur, which raced with typing
  // into the slug box) and frozen as soon as the admin edits the slug directly.
  useEffect(() => {
    if (slugTouched) return;
    const brand = brands.find((b) => b.id === brandId)?.name ?? "";
    const base = slugify(`${brand} ${modelName ?? ""} ${trimValue ?? ""} ${yearValue ?? ""}`);
    if (base) form.setValue("slug", `${base}-${slugSuffix}`);
  }, [brandId, modelName, trimValue, yearValue, slugTouched, slugSuffix, brands, form]);

  function onSubmit(values: VehicleFormInput) {
    startTransition(async () => {
      const galleryPayload = gallery.map((g, idx) => ({ mediaId: g.mediaId, position: idx, view: g.view }));
      const result = vehicleId
        ? await updateVehicleAction(vehicleId, values, galleryPayload)
        : await createVehicleAction(values, galleryPayload);

      if (result.ok) {
        toast.success(vehicleId ? "Vehicle updated" : "Vehicle created");
        router.push("/admin/vehicles");
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="basics">
        <TabsList>
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="specs">Specifications</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="promote">Promote</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-4 rounded-sm border border-border p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Brand</Label>
              <Select
                value={form.watch("brandId")}
                onValueChange={(v) => form.setValue("brandId", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full" aria-label="Brand">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.brandId && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.brandId.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="modelNameOverride">Model Name</Label>
              <Input id="modelNameOverride" placeholder="e.g. Land Cruiser" {...form.register("modelNameOverride")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="trim">Trim / Variant</Label>
              <Input id="trim" {...form.register("trim")} />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input id="year" type="number" {...form.register("year")} />
            </div>
            <div>
              <Label>Condition</Label>
              <Select value={form.watch("condition")} onValueChange={(v) => form.setValue("condition", v as VehicleFormInput["condition"])}>
                <SelectTrigger className="w-full" aria-label="Condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="certified_pre_owned">Certified Pre-Owned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="slug">
              URL Slug {!slugTouched && <span className="text-muted-foreground">(auto-generated)</span>}
            </Label>
            <Input
              id="slug"
              {...form.register("slug", { onChange: () => setSlugTouched(true) })}
            />
            {form.formState.errors.slug && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={5} {...form.register("description")} />
          </div>
          <div>
            <Label htmlFor="conditionNotes">Condition & Inspection Notes</Label>
            <Textarea id="conditionNotes" rows={3} {...form.register("conditionNotes")} />
          </div>
        </TabsContent>

        <TabsContent value="specs" className="space-y-4 rounded-sm border border-border p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="mileageValue">Mileage</Label>
              <Input id="mileageValue" type="number" step="0.1" {...form.register("mileageValue")} />
            </div>
            <div>
              <Label>Mileage Unit</Label>
              <Select value={form.watch("mileageUnit")} onValueChange={(v) => form.setValue("mileageUnit", v as VehicleFormInput["mileageUnit"])}>
                <SelectTrigger className="w-full" aria-label="Mileage unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="km">Kilometres</SelectItem>
                  <SelectItem value="miles">Miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="engineCapacityCc">Engine Capacity (cc)</Label>
              <Input id="engineCapacityCc" type="number" {...form.register("engineCapacityCc")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Fuel Type</Label>
              <Select value={form.watch("fuelTypeId") ?? ""} onValueChange={(v) => form.setValue("fuelTypeId", v)}>
                <SelectTrigger className="w-full" aria-label="Fuel type">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Transmission</Label>
              <Select value={form.watch("transmissionId") ?? ""} onValueChange={(v) => form.setValue("transmissionId", v)}>
                <SelectTrigger className="w-full" aria-label="Transmission">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {transmissionTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Body Type</Label>
              <Select value={form.watch("bodyTypeId") ?? ""} onValueChange={(v) => form.setValue("bodyTypeId", v)}>
                <SelectTrigger className="w-full" aria-label="Body type">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {bodyTypes.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Drivetrain</Label>
              <Select value={form.watch("drivetrain") ?? ""} onValueChange={(v) => form.setValue("drivetrain", v as VehicleFormInput["drivetrain"])}>
                <SelectTrigger className="w-full" aria-label="Drivetrain">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fwd">FWD</SelectItem>
                  <SelectItem value="rwd">RWD</SelectItem>
                  <SelectItem value="awd">AWD</SelectItem>
                  <SelectItem value="four_wd">4WD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Steering</Label>
              <Select value={form.watch("steering") ?? ""} onValueChange={(v) => form.setValue("steering", v as VehicleFormInput["steering"])}>
                <SelectTrigger className="w-full" aria-label="Steering">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lhd">Left-Hand Drive</SelectItem>
                  <SelectItem value="rhd">Right-Hand Drive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cbm">CBM (shipping volume)</Label>
              <Input id="cbm" type="number" step="0.1" {...form.register("cbm")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sourceCountry">Source Country</Label>
              <Input id="sourceCountry" {...form.register("sourceCountry")} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...form.register("location")} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4 rounded-sm border border-border p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fobAmount">FOB Price</Label>
              <Input id="fobAmount" type="number" step="0.01" {...form.register("fobAmount")} />
              {form.formState.errors.fobAmount && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.fobAmount.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="fobCurrency">Currency</Label>
              <Input id="fobCurrency" maxLength={3} {...form.register("fobCurrency")} />
            </div>
          </div>
          <div>
            <Label htmlFor="priceNotes">Price Notes</Label>
            <Textarea id="priceNotes" rows={2} {...form.register("priceNotes")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Status</Label>
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as VehicleFormInput["status"])}>
                <SelectTrigger className="w-full" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.watch("featured")} onCheckedChange={(v) => form.setValue("featured", Boolean(v))} />
                Feature on homepage
              </label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="media" className="rounded-sm border border-border p-5">
          <VehicleMediaUploader value={gallery} onChange={setGallery} />
        </TabsContent>

        <TabsContent value="seo" className="space-y-4 rounded-sm border border-border p-5">
          <div>
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input id="seoTitle" {...form.register("seoTitle")} />
          </div>
          <div>
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea id="seoDescription" rows={3} {...form.register("seoDescription")} />
          </div>
        </TabsContent>

        <TabsContent value="promote" className="rounded-sm border border-border p-5">
          <SocialPostGenerator
            brandName={brands.find((b) => b.id === form.watch("brandId"))?.name ?? ""}
            modelName={form.watch("modelNameOverride") ?? ""}
            trim={form.watch("trim")}
            year={Number(form.watch("year")) || 0}
            fobAmount={Number(form.watch("fobAmount")) || 0}
            fobCurrency={form.watch("fobCurrency")}
            conditionLabel={formatConditionLabel(form.watch("condition") ?? "used")}
            slug={form.watch("slug")}
          />
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="bg-brand-gold text-brand-black hover:bg-brand-gold-light">
          {pending ? "Saving…" : vehicleId ? "Save Changes" : "Create Vehicle"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/vehicles")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
