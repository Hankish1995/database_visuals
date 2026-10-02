import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Devanagari } from "next/font/google";
import { PrefsSync } from "@/components/prefs/PrefsSync";
import { PREFS_SCRIPT } from "@/lib/prefsScript";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });
// Hindi (Devanagari) text; Latin text keeps Inter, which comes first in the stack.
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"] });

export const metadata: Metadata = {
  title: "Inside the Database",
  description: "An interactive learning studio that shows how a relational database runs a query, from parsing to page reads.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

// The server always renders light + English. PREFS_SCRIPT runs before the
// first paint and applies the saved (or OS) theme and the saved language to
// <html>, so the page is never painted in the wrong theme; the attributes it
// sets are why <html> suppresses hydration warnings.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable} ${devanagari.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
      </head>
      <body className="min-h-dvh font-sans">
        <PrefsSync />
        {children}
      </body>
    </html>
  );
}
