'use client';

import Link from "next/link";
import { ArrowRight, Shield, Zap, Users, Code2, Globe, Rocket } from "lucide-react";
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

      {/* Narrative Section: Own Your Future */}
      <div className="border-t border-white/5 bg-gradient-to-b from-black to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/20">
              <Globe className="w-3 h-3 text-[#fbbf24]" />
              <span className="text-xs font-medium text-[#fbbf24]">Built in Africa, For the World</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-light tracking-tight">
              Own Your Future.
              <br />
              <span className="text-[#10b981]">Build Without Permission.</span>
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Your reputation shouldn't be locked in walled gardens. TrustMesh is an open protocol for portable credibility—build trust once, use it everywhere. Break free from platform lock-in. Your identity, your data, your sovereignty.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Rocket className="w-4 h-4 text-[#10b981]" />
                <span>Upward mobility you own</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Shield className="w-4 h-4 text-[#10b981]" />
                <span>Anti-platform, pro-human</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Section: HCS-21 & HCS-22 Standards */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/20">
                <Code2 className="w-3 h-3 text-[#10b981]" />
                <span className="text-xs font-medium text-[#10b981]">Open Standard</span>
              </div>
              <h2 className="text-4xl font-light tracking-tight">
                Help Shape the Standard
              </h2>
              <p className="text-lg text-zinc-400 leading-relaxed">
                TrustMesh is built on <strong className="text-white">HCS-21</strong> (Trust Signals) and <strong className="text-white">HCS-22</strong> (Identity Resolution)—proposed open standards for decentralized reputation on Hedera.
              </p>
              <p className="text-base text-zinc-500 leading-relaxed">
                We need protocol designers, cryptographers, and builders to refine these specs. This is early. Your input matters.
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-mono font-medium text-[#10b981]">21</span>
                  </div>
                  <div>
                    <div className="text-base font-medium text-white">HCS-21: Trust Signals</div>
                    <div className="text-sm text-zinc-500 mt-1">Immutable recognition tokens on Hedera Consensus Service</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-mono font-medium text-[#10b981]">22</span>
                  </div>
                  <div>
                    <div className="text-base font-medium text-white">HCS-22: Identity Resolution</div>
                    <div className="text-sm text-zinc-500 mt-1">Bind DIDs to Hedera accounts without revealing identity</div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <p className="text-sm text-zinc-400 mb-4">Want to contribute?</p>
                <a 
                  href="https://scend.cash" 
                  target="_blank" 
                  rel="noopener"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10b981] hover:bg-[#10b981]/90 text-black font-medium text-sm transition-colors"
                >
                  <span>Contact Us</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-sm text-zinc-600">
              © 2025 TrustMesh · Built on <span className="text-[#10b981]">Hedera</span> · Infrastructure by <a href="https://scend.cash" target="_blank" rel="noopener" className="text-[#fbbf24] hover:text-[#fbbf24]/80 transition-colors">Scend</a>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/signals" className="text-sm text-zinc-600 hover:text-white transition-colors">Demo</Link>
              <a href="https://scend.cash" target="_blank" rel="noopener" className="text-sm text-zinc-600 hover:text-white transition-colors">Scend</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
