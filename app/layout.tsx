import "./globals.css";

import { Geist, Geist_Mono } from "next/font/google";

import Footer from "./components/Footer";
import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "./components/ThemeProvider";
import ThemeSwitcher from "./components/ThemeSwitcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "15-Minute Activity Tracker",
  description: "Track your activities in 15-minute increments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV === "production" && (
          <Script
            defer
            src="https://stats.gocebby.com/script.js"
            data-website-id="f9561ec8-2e43-4e56-abc5-381d6fa1f413"
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans w-full`}
      >
        <ThemeProvider defaultTheme="system" storageKey="theme">
          <div className="fixed top-4 right-4 z-50">
            <ThemeSwitcher />
          </div>
          <main className="w-full">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
