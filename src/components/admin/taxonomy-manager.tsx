"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTaxonomyAction, archiveTaxonomyAction } from "@/app/actions/taxonomies";
import type { Taxonomy } from "@/lib/data/taxonomies";

type TaxonomyTable = "brands" | "body_types" | "fuel_types" | "transmission_types";

export function TaxonomyManager({ table, title, items }: { table: TaxonomyTable; title: string; items: Taxonomy[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await createTaxonomyAction(table, name);
      if (result.ok) {
        setName("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleArchive(id: string) {
    startTransition(async () => {
      const result = await archiveTaxonomyAction(table, id);
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  return (
    <div className="rounded-sm border border-border p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <Input placeholder={`Add ${title.slice(0, -1).toLowerCase()}…`} value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" size="sm" disabled={pending}>
          <Plus className="size-4" />
        </Button>
      </form>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-muted">
            {item.name}
            <button onClick={() => handleArchive(item.id)} disabled={pending} title="Archive" className="text-muted-foreground hover:text-destructive">
              <Archive className="size-3.5" />
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-muted-foreground">None yet.</li>}
      </ul>
    </div>
  );
}
