import Logo from "@/components/ui/Logo";
import Link from "next/link";
import { ReactNode } from "react";

interface NavbarProps {
  theme?: "light" | "dark";
  overlay?: boolean;
  className?: string;
  action?: "book" | "location" | ReactNode | null;
}

export default function Navbar({
  theme = "light",
  overlay = false,
  className = "",
  action = "book",
}: NavbarProps) {
  const isLight = theme === "light";

  const positionClasses = overlay
    ? "absolute top-0 left-0 right-0 bg-transparent border-transparent"
    : isLight
      ? "relative bg-surface-canvas/80 backdrop-blur-md border-border-subtle"
      : "relative bg-surface-canvas border-border-subtle";

  return (
    <header
      className={`z-20 w-full transition-colors ${positionClasses} ${className}`.trim()}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="shrink-0 focus-ring rounded-control inline-flex items-center"
        >
          <Logo theme={theme} />
        </Link>

        <div className="flex items-center gap-3">
          {action === "book" && (
            <Link
              href="/book"
              className={`h-10 px-5 rounded-control font-sans text-caption font-medium flex items-center justify-center transition focus-ring ${
                overlay
                  ? "bg-white/10 hover:bg-white/20 text-text-inverted backdrop-blur-sm"
                  : isLight
                    ? "bg-accent hover:bg-accent/90 text-text-inverted shadow-accent-glow"
                    : "bg-surface-dark hover:bg-accent text-text-inverted"
              }`}
            >
              Book appointment
            </Link>
          )}

          {typeof action !== "string" && action}
        </div>
      </div>
    </header>
  );
}
