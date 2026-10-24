"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { GripVertical, Star, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { registerUploadedMediaAction } from "@/app/actions/media";
import { cn } from "@/lib/utils";
import { PHOTO_VIEWS, RECOMMENDED_VIEWS } from "@/lib/vehicle-photo-views";

export interface GalleryItem {
  mediaId: string;
  url: string;
  type: "image" | "video";
  altText: string | null;
  /** Which angle the photo shows (e.g. "Rear view"); saved into the alt text on save. */
  view: string | null;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm"];
const MAX_SIZE = 50 * 1024 * 1024;

export function VehicleMediaUploader({
  value,
  onChange,
}: {
  value: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createClient();
    const newItems: GalleryItem[] = [];

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: unsupported file type`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name}: file is larger than 50MB`);
        continue;
      }

      const ext = file.name.split(".").pop();
      const storagePath = `vehicles/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("media").upload(storagePath, file, {
        cacheControl: "31536000",
        upsert: false,
      });

      if (uploadError) {
        toast.error(`${file.name}: upload failed — ${uploadError.message}`);
        continue;
      }

      const type = file.type.startsWith("video") ? "video" : "image";
      const result = await registerUploadedMediaAction({
        storagePath,
        type,
        mimeType: file.type,
        filesizeBytes: file.size,
        originalFilename: file.name,
      });

      if (!result.ok || !result.id) {
        toast.error(`${file.name}: could not save media record`);
        continue;
      }

      const { data: pub } = supabase.storage.from("media").getPublicUrl(storagePath);
      newItems.push({ mediaId: result.id, url: pub.publicUrl, type, altText: null, view: null });
    }

    onChange([...value, ...newItems]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(mediaId: string) {
    onChange(value.filter((v) => v.mediaId !== mediaId));
  }

  function makeMain(mediaId: string) {
    const item = value.find((v) => v.mediaId === mediaId);
    if (!item) return;
    onChange([item, ...value.filter((v) => v.mediaId !== mediaId)]);
  }

  function setView(mediaId: string, view: string) {
    onChange(value.map((v) => (v.mediaId === mediaId ? { ...v, view: view || null } : v)));
  }

  const covered = new Set(value.map((v) => v.view));

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Upload Photos / Videos
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, MP4, WebM up to 50MB each.</p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">Buyers expect:</span>
        {RECOMMENDED_VIEWS.map((view) => (
          <span
            key={view}
            className={cn(
              "rounded-sm border px-1.5 py-0.5",
              covered.has(view) ? "border-green-700/30 bg-green-50 text-green-800" : "border-border text-muted-foreground",
            )}
          >
            {covered.has(view) ? "✓ " : ""}
            {view}
          </span>
        ))}
      </div>

      {value.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No media yet. The first photo you upload becomes the main listing image.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((item, idx) => (
            <div key={item.mediaId} className={cn("group relative overflow-hidden rounded-sm border", idx === 0 && "ring-2 ring-brand-gold")}>
              <div className="relative aspect-square bg-muted">
                {item.type === "video" ? (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Video</div>
                ) : (
                  <Image src={item.url} alt="" fill sizes="150px" className="object-cover" />
                )}
              </div>
              {idx === 0 && (
                <span className="absolute left-1 top-1 rounded-sm bg-brand-gold px-1.5 py-0.5 text-[10px] font-semibold text-brand-black">
                  Main
                </span>
              )}
              {item.type === "image" && (
                <select
                  value={item.view ?? ""}
                  onChange={(e) => setView(item.mediaId, e.target.value)}
                  aria-label={`View shown in photo ${idx + 1}`}
                  className="w-full border-t border-border bg-background px-1.5 py-1 text-xs"
                >
                  <option value="">Label this photo…</option>
                  {PHOTO_VIEWS.map((view) => (
                    <option key={view} value={view}>
                      {view}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex items-center justify-between gap-1 bg-background p-1">
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="disabled:opacity-30">
                  <GripVertical className="size-3.5 rotate-90" />
                </button>
                <button type="button" onClick={() => makeMain(item.mediaId)} title="Set as main image">
                  <Star className={cn("size-3.5", idx === 0 && "fill-brand-gold text-brand-gold")} />
                </button>
                <button type="button" onClick={() => remove(item.mediaId)} title="Remove">
                  <Trash2 className="size-3.5 text-destructive" />
                </button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === value.length - 1} className="disabled:opacity-30">
                  <GripVertical className="size-3.5 -rotate-90" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
