import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { NavShell } from "@/components/layout/nav-shell";
import { ensureWorkspaceFiles } from "@/lib/data/seed";

// Seed tasks.json and projects.json if they don't exist
ensureWorkspaceFiles();

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Olympus Mission Control",
  description: "Command center for the AI crew",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-void">
        <NavShell>{children}</NavShell>
      </body>
    </html>
  );
}
