import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { AuthIllustration } from "@/components/auth-illustration";
import { SignOutButton } from "@/components/sign-out-button";

export default async function SignOutPage({
  searchParams,
}: {
  searchParams: Promise<{ complete?: string }>;
}) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const signedOut = !session || params.complete === "1";

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-background">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8 lg:py-14">
        <AuthIllustration className="aspect-[16/9] lg:aspect-[4/3]" priority />

        <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_28px_80px_-44px_rgba(27,39,52,0.45)] sm:p-8">
          <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
            {signedOut ? <Check className="size-5" /> : <ShieldCheck className="size-5" />}
          </span>

          {signedOut ? (
            <>
              <p className="mt-6 text-sm font-bold text-primary">Session closed</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">You are safely signed out</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Your profile, matches, listings, and applications are saved for the next time you return.
              </p>
              <div className="mt-7 grid gap-3">
                <Link href="/auth/signin" className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-bold text-background hover:opacity-90 active:translate-y-px">
                  Sign in again
                </Link>
                <Link href="/" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-bold hover:bg-muted active:translate-y-px">
                  <ArrowLeft className="size-4" /> Return home
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-6 text-sm font-bold text-primary">Before you go</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Sign out of this device?</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                This closes your CredX session here. Your account data and workspace will remain saved.
              </p>

              <div className="mt-6 flex items-center gap-3 rounded-xl bg-muted p-3">
                {session.user.image ? (
                  <Image src={session.user.image} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
                ) : (
                  <span className="grid size-10 place-items-center rounded-full bg-secondary font-bold">
                    {(session.user.name ?? session.user.email).slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{session.user.name ?? "CredX member"}</p>
                  <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <SignOutButton />
                <Link href="/student/dashboard" className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-bold hover:bg-muted active:translate-y-px">
                  Keep working
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
