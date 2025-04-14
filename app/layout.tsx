import "./globals.css";

import { Geist, Geist_Mono } from "next/font/google";

import Footer from "./components/Footer";
import type { Metadata } from "next";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        <Script
          defer
          src="https://stats.gocebby.com/script.js"
          data-website-id="f9561ec8-2e43-4e56-abc5-381d6fa1f413"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
