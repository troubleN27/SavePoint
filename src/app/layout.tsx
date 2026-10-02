import type { Metadata } from "next";
import { Inter, Unbounded } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"] });
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin", "cyrillic"], weight: ["500", "700", "900"] });

export const metadata: Metadata = {
  title: { default: "SavePoint — дневник геймера", template: "%s · SavePoint" },
  description: "Веди коллекцию игр, ставь оценки, пиши отзывы и получай игровой итог года.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} ${unbounded.variable} min-h-dvh antialiased`}>{children}</body>
    </html>
  );
}
