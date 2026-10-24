"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { registerUploadedMediaAction, updateMediaAltTextAction, deleteMediaAction } from "@/app/actions/media";
import type { AdminMediaItem } from "@/lib/data/admin-media";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm"];
const MAX_SIZE = 50 * 1024 * 1024;

export function MediaLibraryGrid({ items }: { items: AdminMediaItem[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const supabase = createClient();

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE) {
        toast.error(`${file.name}: invalid file`);
        continue;
      }
      const ext = file.name.split(".").pop();
      const storagePath = `library/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("media").upload(storagePath, file);
      if (uploadError) {
        toast.error(`${file.name}: ${uploadError.message}`);
        continue;
      }
      await registerUploadedMediaAction({
        storagePath,
        type: file.type.startsWith("video") ? "video" : "image",
        mimeType: file.type,
        filesizeBytes: file.size,
        originalFilename: file.name,
      });
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  function handleDelete(id: string, storagePath: string) {
    if (!confirm("Delete this media file?")) return;
    startTransition(async () => {
      const result = await deleteMediaAction(id, storagePath);
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  function handleAltChange(id: string, value: string) {
    startTransition(async () => {
      await updateMediaAltTextAction(id, value);
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Button variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Upload Media
        </Button>
        <input ref={inputRef} type="file" multiple hidden accept={ALLOWED_TYPES.join(",")} onChange={(e) => handleUpload(e.target.files)} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-sm border border-border">
            <div className="relative aspect-square bg-muted">
              {item.type === "video" ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Video</div>
              ) : (
                <Image src={item.url} alt={item.altText ?? ""} fill sizes="200px" className="object-cover" />
              )}
            </div>
            <div className="space-y-1.5 p-2">
              <p className="truncate text-xs text-muted-foreground">{item.originalFilename}</p>
              <Input
                defaultValue={item.altText ?? ""}
                placeholder="Alt text"
                className="h-7 text-xs"
                onBlur={(e) => handleAltChange(item.id, e.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{item.usageCount} listing(s)</span>
                <button
                  onClick={() => handleDelete(item.id, item.storagePath)}
                  disabled={pending}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="mt-10 text-center text-sm text-muted-foreground">No media uploaded yet.</p>}
    </div>
  );
}
