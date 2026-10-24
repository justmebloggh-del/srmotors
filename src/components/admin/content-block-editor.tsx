"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { upsertContentBlockAction } from "@/app/actions/content";

export function ContentBlockEditor({
  contentKey,
  label,
  defaultTitle,
  defaultBody,
  defaultPublished,
  titleLabel = "Title",
  bodyLabel = "Body text",
  publishedLabel = "Published",
  bodyRows = 5,
  help,
}: {
  contentKey: string;
  label: string;
  defaultTitle: string;
  defaultBody: string;
  defaultPublished: boolean;
  titleLabel?: string;
  bodyLabel?: string;
  publishedLabel?: string;
  bodyRows?: number;
  help?: string;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [body, setBody] = useState(defaultBody);
  const [published, setPublished] = useState(defaultPublished);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await upsertContentBlockAction({ key: contentKey, title, body, published });
      if (result.ok) toast.success(`${label} saved`);
      else toast.error(result.error);
    });
  }

  return (
    <div className="rounded-sm border border-border p-5">
      <h2 className="font-semibold">{label}</h2>
      {help && <p className="mt-1 text-sm text-muted-foreground">{help}</p>}
      <div className="mt-4 space-y-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={titleLabel} aria-label={titleLabel} />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={bodyRows} placeholder={bodyLabel} aria-label={bodyLabel} />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={published} onCheckedChange={(v) => setPublished(Boolean(v))} />
          {publishedLabel}
        </label>
        <Button size="sm" disabled={pending} onClick={handleSave} className="bg-brand-gold text-brand-black hover:bg-brand-gold-light">
          Save
        </Button>
      </div>
    </div>
  );
}
