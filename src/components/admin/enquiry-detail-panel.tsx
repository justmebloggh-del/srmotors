"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addEnquiryNoteAction,
  setEnquiryFollowUpAction,
  setEnquiryStatusAction,
} from "@/app/actions/admin-enquiries";

const STATUSES = ["new", "contacted", "negotiating", "converted", "closed"] as const;

export function EnquiryDetailPanel({
  id,
  status,
  followUpDate,
  notes,
}: {
  id: string;
  status: string;
  followUpDate: string | null;
  notes: { id: string; note: string; createdAt: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  function handleStatusChange(value: string) {
    startTransition(async () => {
      const result = await setEnquiryStatusAction(id, value as (typeof STATUSES)[number]);
      if (result.ok) {
        toast.success("Status updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleFollowUp(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value || null;
    startTransition(async () => {
      await setEnquiryFollowUpAction(id, value);
      router.refresh();
    });
  }

  function handleAddNote() {
    if (!note.trim()) return;
    startTransition(async () => {
      const result = await addEnquiryNoteAction(id, note);
      if (result.ok) {
        setNote("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium">Status</label>
        <Select value={status} onValueChange={handleStatusChange} disabled={pending}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Follow-up Date</label>
        <Input type="date" defaultValue={followUpDate ?? ""} onChange={handleFollowUp} disabled={pending} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Internal Notes</label>
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="rounded-sm bg-muted p-2 text-sm">
              <p>{n.note}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <Textarea
          className="mt-2"
          rows={3}
          placeholder="Add an internal note…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button size="sm" className="mt-2" disabled={pending || !note.trim()} onClick={handleAddNote}>
          Add Note
        </Button>
      </div>
    </div>
  );
}
