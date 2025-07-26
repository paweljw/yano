import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { Navigation } from "./_components/navigation";
import { KeyboardShortcuts } from "./_components/keyboard-shortcuts";
import { Providers } from "./_components/providers";

export const metadata: Metadata = {
  title: "YaNo - Your Daily Task Planner",
  description: "Plan your day with YaNo - A powerful task management tool for productivity enthusiasts",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="bg-zinc-950 font-sans text-zinc-100 antialiased">
        <Providers>
          <TRPCReactProvider>
            <KeyboardShortcuts />
            <div className="flex min-h-screen flex-col">
              <Navigation />
              <main className="flex-1">{children}</main>
            </div>
          </TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}
