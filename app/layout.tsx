import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SocialFloatingFooter } from "./SocialFloatingFooter";
import { loadAnalytics } from "./analytics";
import { Header } from "./header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Static Blog",
  description: "A technology blog built with Next.js, SQLite and Drizzle ORM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {basePath ? <meta name="next-base-path" content={basePath} /> : null}
        <base href={basePath || "/"} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header />
          <AnalyticsInjector />
          <main className="flex-1">{children}</main>
          <SocialFloatingFooter />
        </Providers>
      </body>
    </html>
  );
}

function AnalyticsInjector() {
  if (typeof window !== "undefined") {
    loadAnalytics();
  }
  return null;
}