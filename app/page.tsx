import Link from "next/link";
import { Sparkles } from "lucide-react";
import { MagicLogin } from '@/components/MagicLogin';
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles className="w-10 h-10 text-pri-500 animate-breathe-glow" />
            <h1 className="text-4xl font-bold text-genz-text">TrustMesh</h1>
          </div>
          <p className="text-genz-text-dim mt-3 text-sm leading-relaxed">
            Add contacts, grow your Trust Crew, send and receive recognition signals
          </p>
        </div>

        {/* Login */}
        <MagicLogin />

        {/* Demo link */}
        <div className="text-center">
          <Link href="/signals">
            <Button variant="ghost" size="sm" className="text-genz-text-dim hover:text-genz-text">
              Continue as Demo
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-genz-text-dim pt-4 border-t border-white/10">
          <p>Start with 27 free recognition mints</p>
          <p className="mt-1">Powered by Hedera Consensus Service</p>
        </div>
      </div>
    </main>
  );
}
