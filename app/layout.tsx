import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/menu/header";
import { Suspense } from "react";
import { SessionActions, SessionMenu } from "@/components/auth/session-controls";
import { SocialProvider } from "@/components/social/shared";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "A Batalha dos Meeples",
  description: "Organize sua estante, pontue cada partida e monte o pódio definitivo",
  icons: {
    icon: "/logo3.png",
    shortcut: "/logo3.png",
    apple: "/logo3.png",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable, "dark")}
    >
      <body className="min-h-dvh min-w-0 flex flex-col pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <Header><Suspense fallback={null}><SessionActions /></Suspense></Header>
        <div className="min-w-0 flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0">
          <SocialProvider>{children}</SocialProvider>
        </div>
        <Suspense fallback={null}><SessionMenu /></Suspense>
        <Toaster theme="dark" richColors />
      </body>
    </html>
  );
}
