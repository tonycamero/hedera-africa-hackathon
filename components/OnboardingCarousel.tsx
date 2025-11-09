'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Users, Zap, Gift, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Slide {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const slides: Slide[] = [
  {
    icon: <Sparkles className="w-16 h-16" />,
    title: "Welcome to TrustMesh",
    description: "Send and receive recognition NFTs. Build portable reputation that follows you across campuses and careers.",
    color: "text-pri-400",
  },
  {
    icon: <Gift className="w-16 h-16" />,
    title: "27 Free Mints",
    description: "Every new account starts with 27 free recognition mints. Send recognition to teammates, mentors, or friends.",
    color: "text-sec-400",
  },
  {
    icon: <Users className="w-16 h-16" />,
    title: "Real P2P Recognition",
    description: "Each recognition is minted on Hedera and recorded immutably. Your reputation is verified and portable.",
    color: "text-boost-400",
  },
  {
    icon: <Zap className="w-16 h-16" />,
    title: "Powered by Hedera",
    description: "Fast, low-cost, and eco-friendly. Every signal is recorded on Hedera Consensus Service for transparency.",
    color: "text-pri-500",
  },
  {
    icon: <TrendingUp className="w-16 h-16" />,
    title: "Unlock Opportunities",
    description: "Export your trust portfolio for jobs, internships, and institutions. Your reputation opens doors.",
    color: "text-sec-500",
  },
];

interface OnboardingCarouselProps {
  onComplete: () => void;
}

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="p-8 bg-panel border-white/10">
        {/* Slide content */}
        <div className="text-center space-y-6 min-h-[320px] flex flex-col justify-center">
          <div className={`flex justify-center ${slide.color}`}>
            {slide.icon}
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-genz-text">
              {slide.title}
            </h2>
            <p className="text-genz-text-dim leading-relaxed">
              {slide.description}
            </p>
          </div>
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center gap-2 mt-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-8 bg-pri-500'
                  : 'w-2 bg-white/20 hover:bg-white/30'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-8 gap-4">
          <Button
            variant="ghost"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {isLastSlide ? (
            <Button
              onClick={onComplete}
              className="flex-1 bg-pri-500 hover:bg-pri-600"
            >
              Get Started
            </Button>
          ) : (
            <Button
              onClick={nextSlide}
              className="flex-1"
              variant="secondary"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Skip button */}
        {!isLastSlide && (
          <button
            onClick={onComplete}
            className="w-full mt-4 text-sm text-genz-text-dim hover:text-genz-text transition-colors"
          >
            Skip
          </button>
        )}
      </Card>
    </div>
  );
}
