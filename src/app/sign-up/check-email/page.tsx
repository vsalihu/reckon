import { AuthCard } from "@/components/auth-card";

export default function CheckEmailPage() {
  return (
    <AuthCard title="Check your email">
      <p className="text-sm text-foreground-muted">
        We&apos;ve sent a confirmation link to finish setting up your account. Click it from this device to sign in
        and set up your profile.
      </p>
    </AuthCard>
  );
}
