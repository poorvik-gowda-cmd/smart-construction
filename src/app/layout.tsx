import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SiteMaster – Smart Construction Management",
  description: "A full-stack construction management platform with AI risk analysis, geo-tagged site updates, and real-time financial oversight.",
  keywords: ["construction management", "site tracking", "project management", "AI risk analysis"],
  openGraph: {
    title: "SiteMaster – Smart Construction Management",
    description: "Manage construction projects with AI, geo-tagging, and real-time insights.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-black text-slate-100`}>
        {children}
      </body>
    </html>
  );
}
