export default function Footer() {
  return (
    <footer className="text-center py-4 text-sm text-muted-foreground">
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
    </footer>
  );
}
