import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description, href, action }: { icon: LucideIcon; title: string; description: string; href?: string; action?: string }) {
  return (
    <div className="surface flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground"><Icon className="size-5" /></span>
      <h2 className="mt-5 text-xl font-bold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {href && action && <Link href={href} className="mt-6 inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-sm font-bold text-background hover:opacity-90 active:translate-y-px">{action}</Link>}
    </div>
  );
}
