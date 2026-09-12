import Navbar from "@/components/ui/NavBar";
import heroBg from "@/public/DP4-Treatment.jpg";
import Image from "next/image";
import AboutCard from "./AboutCard";
import BookingCard from "./BookingCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] font-sans antialiased selection:bg-[#B8925D]/20 selection:text-[#B8925D]">
      {/* 1. Header Navigation */}
      <Navbar />
      {/* 2. Atmospheric Hero Section */}
      <section className="relative text-white pt-24 pb-48 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroBg}
            alt="Clinical Treatment"
            fill
            priority
            quality={90}
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-b from-[#1C1917]/65 via-[#1C1917]/80 to-[#1C1917]/95" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <h1 className="font-serif text-4xl sm:text-6xl font-normal leading-[1.1] tracking-tight">
            Subtle Aesthetics. <br className="hidden sm:inline" />
            Undetectable Precision.
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-4 text-sm sm:text-base text-white/90 font-light pt-2">
            <span className="flex items-center gap-1.5 font-normal tracking-wide">
              <span className="text-[#DFC095] font-semibold">10+</span> Years
              Medical Experience
            </span>
            <span className="text-white/30 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 font-normal tracking-wide">
              <span className="text-[#DFC095] font-semibold">★ 4.9/5</span>{" "}
              Patient Rating
            </span>
            <span className="text-white/30 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 font-normal tracking-wide">
              <span className="text-[#DFC095] font-semibold">GMC</span>{" "}
              Registered Doctors
            </span>
          </div>
        </div>
      </section>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 -mt-32 relative z-20 space-y-8">
        <BookingCard />
        <AboutCard />
      </main>
    </div>
  );
}
