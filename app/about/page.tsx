import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Timi | 15-Minute Activity Tracker",
  description:
    "Timi is a tiny tool to track what you're doing every 15 minutes, helping you stay accountable and understand your time better. Built with privacy in mind - all data stays on your device.",
  openGraph: {
    title: "About Timi | 15-Minute Activity Tracker",
    description:
      "Timi is a tiny tool to track what you're doing every 15 minutes, helping you stay accountable and understand your time better.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-3xl mx-auto p-6 sm:p-8 flex flex-col">
        <Link
          href="/"
          className="self-start mb-8 text-muted-foreground hover:text-foreground flex items-center transition-colors group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 group-hover:-translate-x-1 transition-transform"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Timi
        </Link>

        <div className="p-8 rounded-lg border border-secondary/50 bg-secondary/20">
          <div className="mb-10 text-center">
            <h1 className="text-3xl sm:text-4xl font-light mb-1">
              About{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 font-normal">
                Timi
              </span>
            </h1>
            <p className="text-muted-foreground">by Dorell</p>
          </div>

          <div className="space-y-6 text-foreground/80 leading-relaxed">
            <p className="text-xl">
              Timi is a tiny tool I built to track what I'm doing every 15
              minutes — not to micromanage my day, but to understand it.
            </p>

            <p>
              It helps me stay accountable, spot time drains, and build better
              habits by simply asking:{" "}
              <span className="italic text-rose-500">
                "What am I doing right now?"
              </span>
            </p>

            <p>
              Timi isn't about perfection — it's about awareness. Because when
              you know where your time goes, you can start using it with
              purpose.
            </p>

            <div className="pt-8 mt-8 border-t border-secondary/40 text-center">
              <div className="text-sm text-muted-foreground">
                <p>Built with ♥ and on-device AI for better privacy</p>
                <p className="mt-1">
                  <span className="text-rose-500">
                    No data leaves your device.
                  </span>{" "}
                  Your activities, summaries, and preferences stay local.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
