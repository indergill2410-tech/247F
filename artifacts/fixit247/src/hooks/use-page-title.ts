import { useEffect } from "react";

const DEFAULT_SUFFIX = "Fixit 24/7";

export function usePageTitle(title: string, suffix?: string): void {
  useEffect(() => {
    const s = suffix ?? DEFAULT_SUFFIX;
    const full = title === s ? s : `${title} — ${s}`;
    const prev = document.title;
    document.title = full;
    return () => {
      document.title = prev;
    };
  }, [title, suffix]);
}
