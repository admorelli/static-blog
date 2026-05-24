import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeProvider from "@/lib/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Blog Tech — Next.js + SQLite",
  description: "Um blog estático moderno com tema dark/claro, tags e GitHub Pages",
  keywords: ["Next.js", "SQLite", "GitHub Pages", "blog estático"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
