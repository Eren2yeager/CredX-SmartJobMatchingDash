import { redirect } from "next/navigation";
import { Check, FileSearch, ShieldCheck, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { BrandMark } from "@/components/brand-mark";
import { AuthIllustration } from "@/components/auth-illustration";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

const errorMessages: Record<string, string> = {
  OAuthSignin: "Google sign-in could not start. Please try again.",
  OAuthCallback: "Google could not complete sign-in. Please try again.",
  OAuthCreateAccount: "We could not create your CredX account.",
  AccessDenied: "Access was denied. Use a Google account with a valid email address.",
  Callback: "Sign-in could not be completed. Please try again.",
  Configuration: "Sign-in is temporarily unavailable. Check the server configuration.",
  Default: "Sign-in was not completed. Please try again.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl =
    params.callbackUrl?.startsWith("/") && !params.callbackUrl.startsWith("//")
      ? params.callbackUrl
      : "/student/dashboard";

  if (session) redirect(callbackUrl);

  const errorMessage = params.error
    ? errorMessages[params.error] ?? errorMessages.Default
    : null;

  return (
    <main className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[43%] bg-secondary/55 lg:block" />
      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 lg:py-14">
        <section className="max-w-2xl">
          <BrandMark className="lg:hidden" />
          <p className="eyebrow mt-10 lg:mt-0">One account, two paths</p>
          <h1 className="mt-4 max-w-xl font-heading text-5xl leading-[0.95] tracking-wide sm:text-7xl">
            TURN PROOF INTO YOUR NEXT MOVE.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            Sign in once to discover skill-matched roles, manage applications, or hire from a clearer signal.
          </p>

          <div className="mt-9 grid max-w-xl gap-4 sm:grid-cols-3">
            {[
              [FileSearch, "Resume intelligence"],
              [Sparkles, "Explainable matches"],
              [ShieldCheck, "You control your data"],
            ].map(([Icon, label]) => (
              <div key={label as string} className="border-t border-border pt-4">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold leading-5">{label as string}</p>
              </div>
            ))}
          </div>
          <AuthIllustration className="mt-8 aspect-[16/7] max-w-2xl" priority />
        </section>

        <section className="relative rounded-2xl border border-border bg-card p-6 shadow-[0_28px_80px_-44px_rgba(27,39,52,0.45)] sm:p-9">
          <div className="absolute -right-3 -top-3 size-16 rounded-2xl border border-primary/20 bg-accent/70" aria-hidden="true" />
          <div className="relative">
            <p className="text-sm font-bold text-primary">Welcome to CredX</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Continue your workspace</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Google securely verifies your identity. We never receive your password.
            </p>

            {errorMessage && (
              <div role="alert" className="mt-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-semibold text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="mt-7">
              <GoogleSignInButton callbackUrl={callbackUrl} />
            </div>

            <div className="mt-7 border-t border-border pt-6">
              <p className="text-xs font-bold text-foreground">After signing in</p>
              <ul className="mt-3 space-y-2.5 text-xs leading-5 text-muted-foreground">
                {[
                  "Students can build a profile and review matched opportunities.",
                  "Recruiters can post roles and manage applicant pipelines.",
                  "You can switch workspaces without creating another account.",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-7 text-center text-[11px] leading-5 text-muted-foreground">
              By continuing, you agree to use CredX responsibly and keep your profile information accurate.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
