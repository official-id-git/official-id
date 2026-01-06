"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, SkipForward, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { OnboardingSlide } from "@/components/welcome/OnboardingSlide";
import { CircleNetworkIllustration } from "@/components/welcome/CircleNetworkIllustration";
import { SecureLoginIllustration } from "@/components/welcome/SecureLoginIllustration";
import { DigitalCardIllustration } from "@/components/welcome/DigitalCardIllustration";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  const slides = [
    {
      illustration: <CircleNetworkIllustration />,
      title: "Selamat Datang di Official.id",
      description: "Solusi berjejaring mudah di dalam circle dan antara circle yang lain",
    },
    {
      illustration: <SecureLoginIllustration />,
      title: "Pendaftaran Mudah & Aman",
      description: "Pendaftaran mudah dan aman dengan Google dan LinkedIn",
    },
    {
      illustration: <DigitalCardIllustration />,
      title: "Kartu Nama Digital Pintar",
      description: "Bagikan kartu nama digital pintar dengan mudah",
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // If next is clicked on last slide, maybe go to login?
      // But the design disables it or hides it?
      // Design code: disabled={currentSlide === slides.length - 1}
      // So checking logic is fine.
    }
  };

  const handleSkip = () => {
    setCurrentSlide(slides.length - 1);
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Logo */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-8 pb-4 px-6 flex justify-center"
      >
        <div className="relative h-16 w-16">
          <Image
            src="/welcome-logo.png"
            alt="Official.id Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          {/* Slides Container */}
          <AnimatePresence mode="wait">
            <OnboardingSlide
              key={currentSlide}
              illustration={slides[currentSlide].illustration}
              title={slides[currentSlide].title}
              description={slides[currentSlide].description}
            />
          </AnimatePresence>

          {/* Progress Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center gap-2 mt-12"
          >
            {slides.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                    ? "bg-teal-600 w-8"
                    : "bg-gray-300 w-2"
                  }`}
                whileHover={{ scale: 1.2 }}
                onClick={() => setCurrentSlide(index)}
                style={{ cursor: "pointer" }}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="pb-8 px-6 flex justify-center gap-4"
      >
        {/* Login Button */}
        <Button
          onClick={handleLogin}
          variant="outline"
          className="flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          Login
        </Button>

        {/* Skip Button - Only show if not on last slide */}
        {currentSlide < slides.length - 1 && (
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Skip
          </Button>
        )}

        {/* Next Button */}
        <Button
          onClick={handleNext}
          disabled={currentSlide === slides.length - 1}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </div>
  );
}
