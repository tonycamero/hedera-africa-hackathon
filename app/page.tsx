import Link from "next/link";
import { Sparkles, Users, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-8">
        {/* Hero */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-pri-500 animate-breathe-glow" />
            <h1 className="text-4xl font-bold text-pri-500">TrustMesh</h1>
          </div>
          <h2 className="text-3xl font-semibold text-genz-text mb-4">
            Portable reputation for African students
          </h2>
          <p className="text-lg text-genz-text-dim max-w-2xl mx-auto">
            Turn recognition into on-chain proof. Students collect recognition NFTs from faculty and peers.
            Trust updates in real time on Hedera HCS and unlocks opportunities across campuses and borders.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-panel rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-pri-400" />
              <h3 className="font-semibold text-genz-text">Earn Recognition</h3>
            </div>
            <p className="text-sm text-genz-text-dim">
              Mint recognition NFTs with inscriptions explaining why it matters. Every signal is permanent proof on Hedera.
            </p>
          </div>

          <div className="bg-panel rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-sec-400" />
              <h3 className="font-semibold text-genz-text">Build Trust</h3>
            </div>
            <p className="text-sm text-genz-text-dim">
              Your trust graph grows with every connection. Circle of 9 creates meaningful bounded relationships.
            </p>
          </div>

          <div className="bg-panel rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-6 h-6 text-boost-400" />
              <h3 className="font-semibold text-genz-text">Unlock Value</h3>
            </div>
            <p className="text-sm text-genz-text-dim">
              Export verifiable credentials for employers, institutions, and opportunities. Trust follows you anywhere.
            </p>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-panel rounded-xl p-6 border border-white/10">
          <h3 className="font-semibold text-genz-text mb-4">How It Works</h3>
          <ul className="space-y-3 text-sm text-genz-text-dim">
            <li className="flex items-start gap-3">
              <span className="text-pri-400">1.</span>
              <span><strong className="text-genz-text">Professor gives recognition</strong> — Student earns "Research Excellence" NFT for lab work</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pri-400">2.</span>
              <span><strong className="text-genz-text">Trust score updates</strong> — Recognition from trusted sources increases your reputation</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pri-400">3.</span>
              <span><strong className="text-genz-text">Portable credentials</strong> — Export your trust portfolio for internships, jobs, or institutions</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-pri-400">4.</span>
              <span><strong className="text-genz-text">Transparent proof</strong> — Every recognition is immutably recorded on Hedera HCS</span>
            </li>
          </ul>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/signals" 
            className="px-6 py-3 rounded-lg bg-pri-500 hover:bg-pri-600 text-white font-medium text-center transition-colors"
          >
            Open Demo
          </Link>
          <Link 
            href="/hedera" 
            className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 text-genz-text font-medium text-center transition-colors"
          >
            Hedera Stats
          </Link>
          <Link 
            href="/trust-graph" 
            className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 text-genz-text font-medium text-center transition-colors"
          >
            Trust Graph
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-genz-text-dim pt-8 border-t border-white/5">
          <p>Powered by Hedera Consensus Service</p>
          <p className="mt-1">Built for the Hedera Africa Hackathon 2024</p>
        </div>
      </div>
    </main>
  );
}
