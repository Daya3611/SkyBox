import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkyBox — Cloud Storage",
  description:
    "Secure cloud storage powered by Telegram. Store, manage, and share your files seamlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>

      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
