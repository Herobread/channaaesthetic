"use client";

import channa1 from "@/public/channa1.jpeg";
import channa2 from "@/public/channa2.jpg";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const images = [
  { src: channa1, alt: "Dr. Channa - Lead Clinician" },
  { src: channa2, alt: "Dr. Channa - Clinic & Treatments" },
];

interface AboutCardProps {
  className?: string;
  id?: string;
}

export default function AboutCard({
  className = "",
  id = "about",
}: AboutCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      id={id}
      className={`bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] border border-[#EBE5DF] ${className}`}
    >
      {/* Full Portrait Container Carousel */}
      <div className="relative w-full h-[500px] sm:h-[620px] bg-[#1C1917] group">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentIndex
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority={index === 0}
              quality={90}
              className="object-cover object-top"
            />
          </div>
        ))}

        {/* Cinematic Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent z-20 pointer-events-none" />

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          aria-label="Previous Image"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center border border-white/10 transition sm:opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextSlide}
          aria-label="Next Image"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center border border-white/10 transition sm:opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Pagination Dots */}
        <div className="absolute top-6 right-6 z-30 flex items-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to image ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-6 bg-[#DFC095]"
                  : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>

        {/* Overlay Details */}
        <div className="absolute bottom-6 inset-x-6 sm:inset-x-8 text-white space-y-1 z-20 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] uppercase tracking-widest text-[#DFC095] font-medium border border-white/10 mb-1">
            Lead Clinician
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight">
            Dr. Channa
          </h2>
          <p className="text-sm sm:text-base text-white/80 font-light">
            MBChB, MRCS • GMC Registered Doctor
          </p>
        </div>
      </div>

      {/* Content & Bio Section */}
      <div className="p-6 sm:p-9 space-y-6">
        <div className="space-y-3 text-base text-[#666666] font-light leading-relaxed">
          <p>
            I’m Channa, a specialist in skin, aesthetics, and beauty with a
            passion for helping people feel confident in their own skin. With
            years of experience and a commitment to the latest techniques, I
            provide personalized treatments tailored to each client’s needs. At
            my own beauty space, I’ve created a welcoming and relaxing
            environment where you can enjoy professional care and stunning
            results.
          </p>
        </div>

        {/* Minimal Credential Pills */}
        <div className="grid sm:grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAFAF8] border border-[#EBE5DF] text-sm font-medium text-[#1A1A1A]">
            <CheckCircle2 className="w-4 h-4 text-[#B8925D] shrink-0" />
            <span>10+ Years NHS &amp; Surgery</span>
          </div>
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FAFAF8] border border-[#EBE5DF] text-sm font-medium text-[#1A1A1A]">
            <CheckCircle2 className="w-4 h-4 text-[#B8925D] shrink-0" />
            <span>London &amp; Glasgow Clinics</span>
          </div>
        </div>
      </div>
    </div>
  );
}
