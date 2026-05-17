import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Linerup — MLB Analytics",
  description: "Public, transparent MLB analytics model. Every prediction published before first pitch. Every result tracked.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Linerup",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased" style={{ background: "#0a0e1a", color: "#e6edf3" }}>
        {children}
      </body>
    </html>
  );
}
