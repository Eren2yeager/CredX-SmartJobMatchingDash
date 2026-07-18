import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { BrandMark } from "@/components/brand-mark";
import BlurText from "@/components/BlurText";
import SplitText from "@/components/SplitText";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  FileSearch,
  Gauge,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";

const signals = [
  { value: "60%", label: "skills" },
  { value: "25%", label: "GPA" },
  { value: "15%", label: "work authorization" },
];

export default async function Home() {
  const session = await auth();
  const primaryHref = session ? "/student/dashboard" : "/auth/signin";

  return (
    <main className="overflow-hidden">
      <section className="app-container grid min-h-[calc(100dvh-4rem)] items-center gap-10 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:py-16">
        <div className="relative z-10">
          <p className="eyebrow">Skill-first career matching</p>
          <SplitText
            text="FIND WORK THAT FITS."
            tag="h1"
            splitType="words"
            textAlign="left"
            delay={95}
            duration={0.9}
            rootMargin="0px"
            from={{ opacity: 0, y: 52 }}
            to={{ opacity: 1, y: 0 }}
            className="mt-5 max-w-2xl font-heading text-6xl leading-[0.92] tracking-wide text-foreground sm:text-7xl lg:text-8xl"
          />
          <BlurText
            text="CredX turns your real skills into clear job matches, so your next move starts with evidence."
            animateBy="words"
            direction="bottom"
            delay={34}
            stepDuration={0.28}
            className="mt-6 max-w-xl text-lg leading-7 text-muted-foreground"
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={primaryHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-transform hover:brightness-95 active:translate-y-px">
              {session ? "Open matches" : "Start matching"} <ArrowRight className="size-4" />
            </Link>
            <Link href="/#how-it-works" className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-card px-6 text-sm font-bold text-foreground transition-colors hover:bg-muted active:translate-y-px">
              See how it works
            </Link>
          </div>
        </div>

        <div className="relative lg:-mr-28">
          <div className="absolute -left-8 -top-8 size-32 rounded-full bg-accent/70 blur-3xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_35px_90px_-42px_rgba(32,45,58,0.45)]">
            <Image
              src="/images/credx-matching-hero.png"
              alt="A graduate and recruiter connecting through skill-based matching"
              width={1536}
              height={1024}
              priority
              sizes="(max-width: 1024px) 100vw, 62vw"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card" aria-label="Matching signals">
        <div className="app-container grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {signals.map((signal) => (
            <div key={signal.label} className="flex items-baseline gap-3 px-2 py-7 sm:px-8">
              <span className="font-mono text-2xl font-bold text-primary">{signal.value}</span>
              <span className="text-sm font-semibold text-muted-foreground">{signal.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="app-container py-20 sm:py-28">
        <div className="max-w-2xl">
          <h2 className="font-heading text-5xl tracking-wide sm:text-6xl">A CLEARER PATH TO THE RIGHT ROLE.</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">Build one useful profile. CredX does the comparison work and explains every result.</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
          <article className="surface relative overflow-hidden p-7 sm:p-10">
            <FileSearch className="size-8 text-primary" />
            <h3 className="mt-16 max-w-lg text-3xl font-bold tracking-tight">Bring your experience into focus.</h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Upload a DOCX resume or clear resume image, review extracted skills, and keep full control over what appears on your profile.</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["typescript", "product thinking", "data analysis", "communication"].map((skill) => (
                <span key={skill} className="rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground">{skill}</span>
              ))}
            </div>
          </article>

          <article className="rounded-2xl bg-foreground p-7 text-background sm:p-10">
            <Gauge className="size-8 text-primary" />
            <h3 className="mt-16 text-3xl font-bold tracking-tight">Know why a role fits.</h3>
            <p className="mt-3 text-sm leading-6 text-background/70">Every score has a readable breakdown for skills, GPA, and sponsorship compatibility.</p>
          </article>

          <article className="rounded-2xl border border-primary/25 bg-accent p-7 sm:p-10 md:col-span-2">
            <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-end">
              <div>
                <BadgeCheck className="size-8 text-accent-foreground" />
                <h3 className="mt-8 text-3xl font-bold tracking-tight text-accent-foreground">Apply with context, not guesswork.</h3>
              </div>
              <p className="max-w-xl text-sm leading-6 text-accent-foreground/80 md:justify-self-end">Save time by focusing on roles where your strengths are visible, then track every application from one workspace.</p>
            </div>
          </article>
        </div>
      </section>

      <section id="for-recruiters" className="border-y border-border bg-card py-20 sm:py-28">
        <div className="app-container grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <BriefcaseBusiness className="size-9 text-primary" />
            <h2 className="mt-7 max-w-xl font-heading text-5xl tracking-wide sm:text-6xl">LESS SORTING. MORE SIGNAL.</h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">Publish structured roles, see matched candidates, and move applications forward without losing the human context.</p>
            <Link href={session ? "/recruiter/dashboard" : "/auth/signin"} className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-bold text-background hover:opacity-90 active:translate-y-px">
              Open recruiter workspace <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface p-6 sm:translate-y-8">
              <UserRoundSearch className="size-7 text-primary" />
              <h3 className="mt-10 text-xl font-bold">Candidate context</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Review skills and profile details alongside application status.</p>
            </div>
            <div className="surface p-6">
              <Sparkles className="size-7 text-primary" />
              <h3 className="mt-10 text-xl font-bold">Automatic matching</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">New roles and profile updates trigger fresh match calculations.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="app-container py-20 sm:py-28">
        <div className="rounded-3xl bg-foreground px-6 py-14 text-center text-background sm:px-10 sm:py-20">
          <h2 className="mx-auto max-w-3xl font-heading text-5xl tracking-wide sm:text-6xl">YOUR NEXT ROLE SHOULD MAKE SENSE.</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-background/70">Create your profile once, then let better-fit opportunities rise to the top.</p>
          <Link href={primaryHref} className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground hover:brightness-95 active:translate-y-px">
            {session ? "View your matches" : "Create your profile"} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="app-container flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark />
          <p className="text-sm text-muted-foreground">Skill-first matching for students and teams.</p>
          <div className="flex gap-5 text-sm font-semibold">
            <Link href="/student/dashboard" className="hover:text-primary">Students</Link>
            <Link href="/recruiter/dashboard" className="hover:text-primary">Recruiters</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
