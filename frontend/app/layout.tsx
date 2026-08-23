import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nyttetech OS",
  description: "En unødvendigt avanceret teknisk legeplads.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  );
}
