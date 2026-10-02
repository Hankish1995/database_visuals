import { en, type Messages } from "@/i18n/messages/en";
import { hi } from "@/i18n/messages/hi";
import { useLocale, type Locale } from "@/lib/prefs";

// The one translation helper for interface text: components call
// useMessages() and read typed keys (m.topbar.learn, m.playback.stepOf(n, t)),
// never `locale === "hi" ? ... : ...`.
export const MESSAGES: Record<Locale, Messages> = { en, hi };

export function useMessages(): Messages {
  return MESSAGES[useLocale()];
}

export type { Messages };
