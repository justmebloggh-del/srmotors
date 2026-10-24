"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createFaqAction, deleteFaqAction } from "@/app/actions/content";

export function FaqManager({ faqs }: { faqs: { id: string; question: string; answer: string }[] }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    if (!question.trim() || !answer.trim()) return;
    startTransition(async () => {
      const result = await createFaqAction(question, answer);
      if (result.ok) {
        setQuestion("");
        setAnswer("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteFaqAction(id);
      router.refresh();
    });
  }

  return (
    <div className="rounded-sm border border-border p-5">
      <h2 className="mb-4 font-semibold">FAQs</h2>
      <div className="space-y-3">
        {faqs.map((f) => (
          <div key={f.id} className="flex items-start justify-between gap-2 rounded-sm bg-muted p-3">
            <div>
              <p className="text-sm font-medium">{f.question}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.answer}</p>
            </div>
            <button onClick={() => handleDelete(f.id)} disabled={pending} className="shrink-0 text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <Input placeholder="Question" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <Textarea placeholder="Answer" rows={2} value={answer} onChange={(e) => setAnswer(e.target.value)} />
        <Button size="sm" disabled={pending} onClick={handleAdd}>
          Add FAQ
        </Button>
      </div>
    </div>
  );
}
