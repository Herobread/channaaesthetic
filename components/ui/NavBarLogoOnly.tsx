import Logo from "@/components/ui/Logo";
import Link from "next/link";

interface NavBarLogoOnlyProps {
  theme?: "light" | "dark";
  className?: string;
}

export default function NavBarLogoOnly({
  theme = "dark",
  className = "",
}: NavBarLogoOnlyProps) {
  return (
    <header className={`absolute top-0 inset-x-0 z-30 ${className}`}>
      <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-center">
        <Link href="/">
          <Logo theme={theme} />
        </Link>
      </div>
    </header>
  );
}
