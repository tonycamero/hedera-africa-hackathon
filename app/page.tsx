'use client';

import Link from "next/link";
import { ArrowRight, Shield, Zap, Users } from "lucide-react";
import { MagicLogin } from '@/components/MagicLogin';
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="text-lg font-light tracking-tight">TrustMesh</div>
            <div className="flex items-center gap-8">
              <Link href="/signals" className="text-sm text-zinc-400 hover:text-white transition-colors">Demo</Link>
              <a href="https://scend.cash" target="_blank" rel="noopener" className="text-sm text-zinc-400 hover:text-white transition-colors">Scend</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero + Portal (Above-the-fold) */}
      <div className="min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full pt-16">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
            
            {/* Left: Value Prop */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                  <span className="text-xs font-medium text-[#10b981]">Hedera Africa Hackathon 2025</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-light tracking-tight leading-[1.1]">
                  TrustMesh
                  <br />
                  <span className="text-[#10b981] font-normal">Programmable Trust Infrastructure</span>
                </h1>
                <p className="text-xl text-zinc-400 leading-relaxed max-w-xl">
                  A hackathon prototype exploring portable reputation, anonymous trust staking, and verifiable credibility on Hedera.
                </p>
              </div>

              {/* Proof Points */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <div>
                    <div className="text-base font-medium text-white">Proof of Character</div>
                    <div className="text-sm text-zinc-500 mt-0.5">Trust scores backed by immutable on-chain signals</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#fbbf24]/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Zap className="w-5 h-5 text-[#fbbf24]" />
                  </div>
                  <div>
                    <div className="text-base font-medium text-white">Composable Infrastructure</div>
                    <div className="text-sm text-zinc-500 mt-0.5">Works with Scend, CraftTrust, and any commerce layer</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <div>
                    <div className="text-base font-medium text-white">Network Effects</div>
                    <div className="text-sm text-zinc-500 mt-0.5">Every signal strengthens the mesh. Trust compounds.</div>
                  </div>
                </div>
              </div>

              {/* Footer Micro-copy */}
              <div className="pt-8 border-t border-white/5">
                <p className="text-sm text-zinc-600">
                  Built on <span className="text-[#10b981]">Hedera HCS</span> · Infrastructure by <a href="https://scend.cash" target="_blank" rel="noopener" className="text-[#fbbf24] hover:text-[#fbbf24]/80 transition-colors">Scend</a>
                </p>
              </div>
            </div>

            {/* Right: Magenta Portal (CTA) */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#ec4899]/20 to-[#8b5cf6]/20 blur-3xl" />
              <div className="relative bg-[#1a1a1a] border border-[#ec4899]/20 rounded-2xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-medium text-white">Try Our Hackathon Entry</h2>
                    <p className="text-sm text-zinc-400">
                      Explore the prototype. Works on localhost and testnet.
                    </p>
                  </div>

                  {/* Magic Login Form */}
                  <MagicLogin />

                  {/* Demo link */}
                  <div className="pt-4 border-t border-white/5">
                    <Link href="/signals" className="flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors group">
                      <span>Explore demo</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
                    <div className="text-center">
                      <div className="text-2xl font-medium text-[#10b981]">135</div>
                      <div className="text-xs text-zinc-500 mt-1">Free Signals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-medium text-[#fbbf24]">∞</div>
                      <div className="text-xs text-zinc-500 mt-1">Trust Graph</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-medium text-[#ec4899]">Web3</div>
                      <div className="text-xs text-zinc-500 mt-1">Native</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
