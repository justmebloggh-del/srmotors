import Image from "next/image";
import Link from "next/link";
import { Fuel, Gauge, Cog, Calendar, Images } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMileage, formatPrice, statusLabel } from "@/lib/utils/format";
import { vehicleWhatsappMessage, whatsappLink, siteConfig } from "@/lib/site-config";
import type { VehicleListItem } from "@/types/vehicle";

export function VehicleCard({ vehicle }: { vehicle: VehicleListItem }) {
  const title = `${vehicle.brand} ${vehicle.model}`;
  const url = `${siteConfig.url}/vehicles/${vehicle.slug}`;

  return (
    <div className="group flex flex-col overflow-hidden rounded-sm border border-border bg-card transition-shadow hover:shadow-lg">
      <Link href={`/vehicles/${vehicle.slug}`} className="relative block aspect-[3/2] overflow-hidden bg-muted">
        {vehicle.mainImageUrl ? (
          <Image
            src={vehicle.mainImageUrl}
            alt={`${vehicle.year} ${title}`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 85vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No image yet
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {vehicle.featured && (
            <Badge className="bg-brand-gold text-brand-black hover:bg-brand-gold">Featured</Badge>
          )}
          {vehicle.status !== "available" && (
            <Badge variant="secondary" className="bg-brand-black text-white">
              {statusLabel(vehicle.status)}
            </Badge>
          )}
        </div>
        {vehicle.photoCount > 1 && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-sm bg-black/65 px-2 py-0.5 text-xs font-medium text-white">
            <Images className="size-3.5" aria-hidden="true" />
            {vehicle.photoCount} photos
          </span>
        )}
        {vehicle.isSample && (
          <Badge className="absolute right-3 top-3 border-white/40 bg-white/90 text-brand-black hover:bg-white/90">
            Sample listing
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <Link href={`/vehicles/${vehicle.slug}`}>
            <h3 className="text-lg font-semibold leading-tight text-foreground hover:text-brand-gold-dark">
              {vehicle.year} {title}
            </h3>
          </Link>
          {vehicle.trim && <p className="text-sm text-muted-foreground">{vehicle.trim}</p>}
        </div>

        <div className="grid grid-cols-2 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" /> {vehicle.year}
          </span>
          <span className="flex items-center gap-1.5">
            <Gauge className="size-3.5" /> {formatMileage(vehicle.mileageValue, vehicle.mileageUnit)}
          </span>
          <span className="flex items-center gap-1.5">
            <Fuel className="size-3.5" /> {vehicle.fuelType ?? "—"}
          </span>
          <span className="flex items-center gap-1.5">
            <Cog className="size-3.5" /> {vehicle.transmission ?? "—"}
          </span>
        </div>

        <div className="mt-auto space-y-3 pt-2">
          <div>
            <p className="text-xl font-bold text-brand-charcoal">
              {formatPrice(vehicle.fobAmount, vehicle.fobCurrency)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">FOB</span>
            </p>
            {vehicle.ghsApprox && (
              <p className="text-xs text-muted-foreground" title={vehicle.ghsApprox.rateNote}>
                ≈ {formatPrice(vehicle.ghsApprox.amount, "GHS")} (indicative)
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" className="flex-1 bg-brand-black text-white hover:bg-brand-charcoal">
              <Link href={`/vehicles/${vehicle.slug}`}>View Details</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="flex-1">
              <Link href={`/import-calculator?vehicle=${vehicle.slug}`}>Import Estimate</Link>
            </Button>
          </div>
          <a
            href={whatsappLink(
              vehicleWhatsappMessage({
                title,
                year: vehicle.year,
                fobAmount: vehicle.fobAmount,
                fobCurrency: vehicle.fobCurrency,
                url,
              }),
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs font-medium text-[#075E54] hover:underline"
          >
            Enquire on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
