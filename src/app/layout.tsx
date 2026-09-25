import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QA Tracker — Own InfoTech",
  description: "Assign test points, track results, and manage fixes for the whole team.",
  icons: {
    icon: [{ url: "/favicon.png?v=2", type: "image/png" }],
    apple: [{ url: "/apple-icon.png?v=2", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-page font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
