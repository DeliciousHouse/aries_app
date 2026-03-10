import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { AppSessionProvider } from "@/components/session-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aries AI",
  description: "AI-powered social media marketing automation by Sugar and Leather.",
  manifest: "/manifest.json",
  other: {
    "facebook-domain-verification": "4hmx9o44vy7ivv1zlyp5fgl3sbbwqw",
  },
  icons: {
    icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/brand/favicon.svg"],
    apple: ["/brand/favicon.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        <AppSessionProvider>
          <AppShell>{children}</AppShell>
        </AppSessionProvider>
      </body>
    </html>
  );
}
