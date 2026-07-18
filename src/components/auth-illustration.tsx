import Image from "next/image";
import { cn } from "@/lib/utils";

export function AuthIllustration({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border bg-secondary", className)}>
      <Image
        src="/illustrations/auth-career-path.webp"
        alt="A professional continuing along a career path while their resume and skills workspace stays organized"
        fill
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 58vw"
        className="object-cover object-center"
      />
    </div>
  );
}
