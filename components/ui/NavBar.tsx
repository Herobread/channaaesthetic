import Logo from "@/components/ui/Logo";
import Link from "next/link";

interface NavbarProps {
  theme?: "light" | "dark";
  className?: string;
  showBookButton?: boolean;
}

export default function Navbar({
  theme = "light",
  className = "",
  showBookButton = true,
}: NavbarProps) {
  const isLight = theme === "light";

  return (
    <header className={`absolute top-0 inset-x-0 z-30 ${className}`}>
      <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/">
          <Logo theme={theme} />
        </Link>

        {showBookButton && (
          <Link
            href="/book"
            className={`px-6 py-2.5 rounded text-sm font-medium tracking-wider transition ${
              isLight
                ? "bg-white/10 hover:bg-[#B8925D] text-white"
                : "bg-[#1A1A1A] hover:bg-[#B8925D] text-white"
            }`}
          >
            Book
          </Link>
        )}
      </div>
    </header>
  );
}
