import { useSyncExternalStore } from "react";

// Theme and language preferences. The inline script in app/layout.tsx reads
// them from localStorage and sets <html data-theme lang> before the first
// paint; this module keeps them in sync afterwards. The <html> attributes are
// the source of truth on the client, so every component reads the same value
// and switching never resets any other state.
export type Theme = "light" | "dark";
export type Locale = "en" | "hi";

import { LOCALE_KEY, THEME_KEY } from "@/lib/prefsScript";

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const notify = () => listeners.forEach((fn) => fn());

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the choice still applies for this visit.
  }
}

const readTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const readLocale = (): Locale => (document.documentElement.lang === "hi" ? "hi" : "en");

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  save(THEME_KEY, theme);
  notify();
}

export function setLocale(locale: Locale) {
  document.documentElement.lang = locale;
  save(LOCALE_KEY, locale);
  notify();
}

/** The server renders light/English; the client snapshot follows <html>. */
export const useTheme = () => useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
export const useLocale = () => useSyncExternalStore(subscribe, readLocale, () => "en" as Locale);

/** Runs in <head> before paint: applies the saved (or OS) theme and the saved language. */
