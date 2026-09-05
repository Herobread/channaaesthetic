import Logo from "@/components/ui/Logo";
import Link from "next/link";
import LocationPicker from "../shared/LocationPicker";

interface NavBarProps {
  theme?: "light" | "dark";
  className?: string;
}

export default function NavBar({
  theme = "dark",
  className = "",
}: NavBarProps) {
  return (
    <header className={`absolute top-0 inset-x-0 z-30 ${className}`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0">
          <Logo theme={theme} />
        </Link>

        <LocationPicker />
      </div>
    </header>
  );
}
