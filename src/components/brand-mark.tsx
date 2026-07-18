import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="CredX home"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <Image
        src="/brand/credx-mark.png"
        alt=""
        width={40}
        height={40}
        className="size-9 shrink-0 object-contain"
      />
      <span className="font-heading text-2xl tracking-wide">CREDX</span>
    </Link>
  );
}
