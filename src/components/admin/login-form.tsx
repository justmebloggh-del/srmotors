"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, requestPasswordResetAction } from "@/app/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [resetSent, setResetSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signInAction({ email, password });
      if (result.ok) {
        router.push(next && next.startsWith("/admin") ? next : "/admin");
        router.refresh();
      } else {
        setError(result.error ?? "Sign in failed.");
      }
    });
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await requestPasswordResetAction(email);
      setResetSent(true);
    });
  }

  if (mode === "reset") {
    return (
      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <Label htmlFor="reset-email">Email</Label>
          <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {resetSent ? (
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, a reset link has been sent.
          </p>
        ) : (
          <Button type="submit" disabled={pending} className="w-full bg-brand-gold text-brand-black hover:bg-brand-gold-light">
            Send Reset Link
          </Button>
        )}
        <button type="button" onClick={() => setMode("login")} className="text-sm text-muted-foreground hover:underline">
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full bg-brand-gold text-brand-black hover:bg-brand-gold-light">
        {pending ? "Signing in…" : "Sign In"}
      </Button>
      <button type="button" onClick={() => setMode("reset")} className="text-sm text-muted-foreground hover:underline">
        Forgot password?
      </button>
    </form>
  );
}
