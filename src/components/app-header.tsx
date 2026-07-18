import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { BrandMark } from "@/components/brand-mark";
import { BriefcaseBusiness, ChevronDown, LogOut, UserRound } from "lucide-react";

const studentLinks = [
  { href: "/student/dashboard", label: "Matches" },
  { href: "/student/applications", label: "Applications" },
  { href: "/student/profile", label: "Profile" },
];

const recruiterLinks = [
  { href: "/recruiter/dashboard", label: "Recruiter overview" },
  { href: "/recruiter/listings", label: "Job listings" },
  { href: "/recruiter/listings/new", label: "Post a role" },
];

export async function AppHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/92 backdrop-blur-xl">
      <div className="app-container flex h-16 items-center justify-between gap-4">
        <BrandMark />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {session ? (
            <>
              {studentLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  {link.label}
                </Link>
              ))}
              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  Recruit <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="absolute right-0 top-11 w-56 rounded-xl border border-border bg-card p-2 shadow-xl shadow-foreground/10">
                  {recruiterLinks.map((link) => (
                    <Link key={link.href} href={link.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </details>
            </>
          ) : (
            <>
              <Link href="/#how-it-works" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">How it works</Link>
              <Link href="/#for-recruiters" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">For recruiters</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-3 text-sm font-semibold hover:border-foreground/25">
                {session.user.image ? (
                  <Image src={session.user.image} alt="" width={30} height={30} className="size-7 rounded-full object-cover" />
                ) : (
                  <span className="grid size-7 place-items-center rounded-full bg-secondary"><UserRound className="size-4" /></span>
                )}
                <span className="hidden max-w-28 truncate sm:block">{session.user.name ?? "Account"}</span>
                <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 top-12 w-64 rounded-xl border border-border bg-card p-2 shadow-xl shadow-foreground/10">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-semibold">{session.user.name ?? "CredX member"}</p>
                  <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                </div>
                <div className="my-1 h-px bg-border" />
                <Link href="/student/profile" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"><UserRound className="size-4" /> Profile</Link>
                <Link href="/recruiter/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"><BriefcaseBusiness className="size-4" /> Recruiter workspace</Link>
                <Link href="/api/auth/signout" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"><LogOut className="size-4" /> Sign out</Link>
              </div>
            </details>
          ) : (
            <Link href="/api/auth/signin" className="inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-sm font-bold text-background transition-transform hover:opacity-90 active:translate-y-px">
              Sign in
            </Link>
          )}
        </div>
      </div>

      {session && (
        <nav className="app-container flex gap-1 overflow-x-auto pb-2 lg:hidden" aria-label="Mobile navigation">
          {[...studentLinks, { href: "/recruiter/dashboard", label: "Recruit" }].map((link) => (
            <Link key={link.href} href={link.href} className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">{link.label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
