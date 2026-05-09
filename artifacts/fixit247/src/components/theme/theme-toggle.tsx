import { useEffect, useState } from "react";
import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isWarm = mounted && theme === "warm";
  const nextTheme = isWarm ? "dark" : "warm";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[color:var(--app-shell-border)] px-3 text-xs font-bold text-[color:var(--app-shell-muted)] transition-all hover:bg-[color:var(--app-shell-hover)] hover:text-[color:var(--app-shell-strong)]"
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      {isWarm ? <Moon className="h-4 w-4" aria-hidden="true" /> : <SunMedium className="h-4 w-4" aria-hidden="true" />}
      <span className="hidden lg:inline">{isWarm ? "Dark" : "Warm"}</span>
    </button>
  );
}
