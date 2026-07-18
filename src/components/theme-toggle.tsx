"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export function ThemeToggle() {
  return (
    <AnimatedThemeToggler
      variant="circle"
      duration={520}
      aria-label="Toggle light and dark theme"
      title="Toggle light and dark theme"
      className="group relative grid size-10 place-items-center overflow-hidden rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition-[color,background-color,border-color,transform] hover:border-foreground/25 hover:bg-muted hover:text-foreground active:scale-95"
    />
  );
}
