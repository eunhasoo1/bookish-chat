import type { Metadata } from "next";
import { Caveat, Special_Elite } from "next/font/google";
import "./globals.css";

const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-typewriter",
  display: "swap",
});

const caveat = Caveat({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-handwriting",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BookishChat",
  description: "A vintage library-card reading journal with Edmund, your AI librarian.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${specialElite.variable} ${caveat.variable} h-full`}
    >
      <body className="h-full overflow-hidden antialiased">{children}</body>
    </html>
  );
}
