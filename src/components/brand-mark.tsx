import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="CredX home"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <span className="grid size-9 place-items-center rounded-lg bg-foreground font-heading text-xl leading-none text-background">
        CX
      </span>
      <span className="font-heading text-2xl tracking-wide">CREDX</span>
    </Link>
  );
}
