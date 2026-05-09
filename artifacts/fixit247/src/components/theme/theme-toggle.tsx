import { useEffect, useState } from "react";
import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

type ThemeToggleProps = {
  variant?: "default" | "mini";
  className?: string;
};

export function ThemeToggle({ variant = "default", className = "" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isWarm = mounted && theme === "warm";
  const nextTheme = isWarm ? "dark" : "warm";
  const Icon = isWarm ? Moon : SunMedium;

  if (variant === "mini") {
    return (
      <button
        type="button"
        onClick={() => setTheme(nextTheme)}
        className={`group inline-flex h-10 items-center gap-2 rounded-full border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell)]/65 px-3 text-xs font-bold text-[color:var(--app-shell-muted)] shadow-lg shadow-black/20 backdrop-blur-md transition-all hover:bg-[color:var(--app-shell)]/85 hover:text-[color:var(--app-shell-strong)] ${className}`}
        aria-label={`Switch to ${nextTheme} theme`}
        title={`Switch to ${nextTheme} theme`}
      >
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="hidden sm:inline">Theme</span>
        <span className="flex items-center gap-1" aria-hidden="true">
          <span className={`h-1.5 w-1.5 rounded-full transition-colors ${!isWarm ? "bg-primary" : "bg-[color:var(--app-shell-muted)]/40"}`} />
          <span className={`h-1.5 w-5 rounded-full transition-colors ${isWarm ? "bg-primary" : "bg-[color:var(--app-shell-muted)]/40"}`} />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className={`inline-flex h-9 items-center gap-2 rounded-lg border border-[color:var(--app-shell-border)] px-3 text-xs font-bold text-[color:var(--app-shell-muted)] transition-all hover:bg-[color:var(--app-shell-hover)] hover:text-[color:var(--app-shell-strong)] ${className}`}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="hidden lg:inline">{isWarm ? "Dark" : "Warm"}</span>
    </button>
  );
}
