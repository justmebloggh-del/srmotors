"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Taxonomy } from "@/lib/data/taxonomies";

export function VehicleQuickSearch({
  brands,
  bodyTypes,
}: {
  brands: Taxonomy[];
  bodyTypes: Taxonomy[];
}) {
  const router = useRouter();
  const [brand, setBrand] = useState<string>("");
  const [bodyType, setBodyType] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  function handleSearch() {
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (bodyType) params.set("bodyType", bodyType);
    if (maxPrice) params.set("priceMax", maxPrice);
    router.push(`/vehicles${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <Select value={brand} onValueChange={setBrand}>
        <SelectTrigger className="w-full bg-white text-foreground" aria-label="Manufacturer">
          <SelectValue placeholder="Any Manufacturer" />
        </SelectTrigger>
        <SelectContent>
          {brands.map((b) => (
            <SelectItem key={b.id} value={b.slug}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={bodyType} onValueChange={setBodyType}>
        <SelectTrigger className="w-full bg-white text-foreground" aria-label="Body type">
          <SelectValue placeholder="Any Body Type" />
        </SelectTrigger>
        <SelectContent>
          {bodyTypes.map((b) => (
            <SelectItem key={b.id} value={b.slug}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={maxPrice} onValueChange={setMaxPrice}>
        <SelectTrigger className="w-full bg-white text-foreground" aria-label="Maximum price">
          <SelectValue placeholder="Max Price (USD)" />
        </SelectTrigger>
        <SelectContent>
          {[10000, 20000, 30000, 50000, 80000, 120000].map((p) => (
            <SelectItem key={p} value={String(p)}>
              Up to ${p.toLocaleString()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={handleSearch} className="bg-brand-gold text-brand-black hover:bg-brand-gold-light">
        <Search className="size-4" />
        Search
      </Button>
    </div>
  );
}
