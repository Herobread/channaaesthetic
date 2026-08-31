"use client";

import Logo from "@/components/ui/Logo";
import { useEffect, useState } from "react";

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className = "" }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/30 backdrop-blur-md" : "bg-transparent"
      } ${className}`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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
