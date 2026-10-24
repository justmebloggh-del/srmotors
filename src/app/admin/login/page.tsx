import Image from "next/image";
import { LoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const resolved = await searchParams;
  const next = typeof resolved.next === "string" ? resolved.next : undefined;
  const authError = resolved.error === "not_authorized";

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-black px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image src="/brand/logo-lockup.png" alt="SR Motors" width={180} height={96} className="h-16 w-auto" />
        </div>
        <div className="rounded-sm bg-white p-6">
          <h1 className="mb-1 text-lg font-semibold">Admin Sign In</h1>
          <p className="mb-6 text-sm text-muted-foreground">SR Motors staff only.</p>
          {authError && (
            <p className="mb-4 rounded-sm bg-destructive/10 p-2 text-sm text-destructive">
              Your account is not authorized for admin access.
            </p>
          )}
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
