import Logo from "@/components/ui/Logo";

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className = "" }: NavbarProps) {
  return (
    <header className={`absolute top-0 inset-x-0 z-30 ${className}`}>
      <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Logo theme="light" />

        <a
          href="#book"
          className="bg-white/10 hover:bg-[#B8925D] text-white px-6 py-2.5 rounded text-sm font-medium tracking-wider transition"
        >
          Book
        </a>
      </div>
    </header>
  );
}
