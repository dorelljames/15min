import ChromeAIStatusIndicator from "./ChromeAIStatusIndicator";

export default function Footer() {
  return (
    <footer className="w-full mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between py-4 text-sm text-muted-foreground border-t border-border/50">
        <div>
          <ChromeAIStatusIndicator />
        </div>
        <div className="mt-3 sm:mt-0">
          Made with{" "}
          <span className="text-rose-500" aria-label="love">
            ❤️
          </span>{" "}
          by{" "}
          <a
            href="https://dorelljames.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-rose-500 hover:underline"
          >
            Dorell James
          </a>
          {" • "}
          <a href="/about" className="text-rose-500 hover:underline">
            About
          </a>
          {" • "}
          <a
            href="https://github.com/dorelljames/15min"
            target="_blank"
            rel="noopener noreferrer"
            className="text-rose-500 hover:underline"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
