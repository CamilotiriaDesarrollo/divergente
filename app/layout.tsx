import type { Metadata } from "next";
import { eastman, montserrat } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Divergente",
  description:
    "Los datos miden, la IA procesa, los sistemas organizan. Divergente trabaja con personas y organizaciones que crean con propósito.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${eastman.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
