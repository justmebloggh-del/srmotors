import { ResetPasswordForm } from "@/components/admin/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-black px-6">
      <div className="w-full max-w-sm rounded-sm bg-white p-6">
        <h1 className="mb-1 text-lg font-semibold">Set a New Password</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Choose a new password for your SR Motors admin account.
        </p>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
