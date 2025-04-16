import ActivityTracker from "./components/ActivityTracker";
import ChromeAINotification from "./components/ChromeAINotification";
import Footer from "./components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timi | 15-Minute Activity Tracker",
  description:
    "Track what you're doing every 15 minutes to increase productivity, spot time drains, and build better habits. On-device AI for privacy - your data stays local.",
  openGraph: {
    title: "Timi | 15-Minute Activity Tracker",
    description:
      "Track what you're doing every 15 minutes to increase productivity, spot time drains, and build better habits.",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      <ActivityTracker />
      <Footer />
    </div>
  );
}
