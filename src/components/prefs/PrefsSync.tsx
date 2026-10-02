"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMessages } from "@/i18n";
import { useLocale } from "@/lib/prefs";

// Keeps the document in step with the chosen language: reveals the page once
// the client has rendered in the saved language (see html.locale-pending in
// globals.css), and words the tab title. Renders nothing.
export function PrefsSync() {
  const locale = useLocale();
  const titles = useMessages().pageTitles;
  const path = usePathname();
  useEffect(() => {
    // During hydration React renders the server's language first; wait for
    // the render in the language <html> actually carries.
    if (document.documentElement.lang === locale) document.documentElement.classList.remove("locale-pending");
  }, [locale]);
  useEffect(() => {
    // Next writes the page's (English) metadata title after navigation, so
    // re-apply ours whenever <head> changes. Setting an equal title is a no-op.
    const wanted = titles[path] ?? titles["/"];
    const apply = () => { if (document.title !== wanted) document.title = wanted; };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [titles, path]);
  return null;
}
