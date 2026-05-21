import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ranking 3PL Shopee",
  description: "Portal de relatório individual por transportadora"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
