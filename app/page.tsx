'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { OnboardingCarousel } from '@/components/OnboardingCarousel';
import { MagicLogin } from '@/components/MagicLogin';

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <main className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-pri-500 animate-breathe-glow" />
            <h1 className="text-4xl font-bold text-pri-500">TrustMesh</h1>
          </div>
          <p className="text-genz-text-dim">
            Portable reputation powered by Hedera
          </p>
        </div>

        {/* Content */}
        {!showLogin ? (
          <OnboardingCarousel onComplete={() => setShowLogin(true)} />
        ) : (
          <MagicLogin />
        )}

        {/* Footer */}
        <div className="text-center text-sm text-genz-text-dim mt-8">
          <p>Powered by Hedera Consensus Service</p>
          <p className="mt-1">Built for Hedera Africa Hackathon 2024</p>
        </div>
      </div>
    </main>
  );
}
