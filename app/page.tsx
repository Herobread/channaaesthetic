import Navbar from "@/components/ui/NavBar";
import heroBg from "@/public/DP4-Treatment.jpg";
import Image from "next/image";
import AboutCard from "./AboutCard";
import BookingCard from "./BookingCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-canvas text-text-primary font-sans antialiased selection:bg-accent/20 selection:text-accent">
      {/* 1. Header Navigation */}
      <Navbar />

      {/* 2. Atmospheric Hero Section */}
      <section className="relative text-text-inverted pt-24 pb-48 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroBg}
            alt="Clinical Treatment"
            fill
            priority
            quality={90}
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-b from-surface-dark/65 via-surface-dark/80 to-surface-dark/95" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <h1 className="font-serif text-display font-normal">
            Subtle Aesthetics. <br className="hidden sm:inline" />
            Undetectable Precision.
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-4 text-caption sm:text-body text-text-inverted/90 font-normal pt-2">
            <span className="flex items-center gap-1.5 tracking-wide">
              <span className="text-accent-champagne font-semibold">10+</span>{" "}
              Years Medical Experience
            </span>
            <span className="text-text-inverted/30 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 tracking-wide">
              <span className="text-accent-champagne font-semibold">
                ★ 4.9/5
              </span>{" "}
              Patient Rating
            </span>
            <span className="text-text-inverted/30 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 tracking-wide">
              <span className="text-accent-champagne font-semibold">GMC</span>{" "}
              Registered Doctors
            </span>
          </div>
        </div>
      </section>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 -mt-32 relative z-20 space-y-8 pb-20">
        <BookingCard />
        <AboutCard />
      </main>
    </div>
  );
}
