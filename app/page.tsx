'use client';

import Link from "next/link";
import { ArrowRight, Shield, Zap, Users, Code2, Globe, Rocket, MessageCircle, Lock, Send } from "lucide-react";
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

      {/* XMTP Messaging Feature */}
      <div className="border-t border-white/5 bg-gradient-to-b from-black to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
            
            {/* Left: Feature Description */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                <Lock className="w-3 h-3 text-purple-400" />
                <span className="text-xs font-medium text-purple-400">End-to-End Encrypted</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-light tracking-tight">
                Private Messaging.
                <br />
                <span className="text-purple-400">Decentralized by Default.</span>
              </h2>
              <p className="text-lg text-zinc-400 leading-relaxed">
                Send encrypted messages and value (TRST/USD) to trusted contacts. Built on XMTP protocol—your conversations live on Web3, not in corporate databases.
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#10b981]/5 border border-[#10b981]/20">
                  <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                  <span className="text-sm text-zinc-400">Online Status</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <Lock className="w-3 h-3 text-purple-400" />
                  <span className="text-sm text-zinc-400">E2EE Protocol</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#fbbf24]/5 border border-[#fbbf24]/20">
                  <Zap className="w-3 h-3 text-[#fbbf24]" />
                  <span className="text-sm text-zinc-400">Send TRST/USD</span>
                </div>
              </div>
            </div>

            {/* Right: Mock XMTP Card (Pops) */}
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-br from-purple-500/20 via-[#ec4899]/20 to-[#10b981]/20 blur-3xl opacity-60" />
              <div className="relative">
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-purple-500/30 rounded-2xl p-8 shadow-2xl">
                  {/* Contact Header */}
                  <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-[#ec4899]/20 flex items-center justify-center">
                        <Users className="w-7 h-7 text-purple-400" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#10b981] border-2 border-[#1a1a1a]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-medium text-white">Trusted Contact</div>
                      <div className="flex items-center gap-2 text-sm text-[#10b981]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                        <span>Online</span>
                      </div>
                    </div>
                  </div>

                  {/* Message Preview */}
                  <div className="py-6 space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0" />
                      <div className="bg-zinc-800/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[70%]">
                        <p className="text-sm text-zinc-300">Hey! Ready to collaborate?</p>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[70%]">
                        <p className="text-sm text-white">Absolutely. Let's build trust.</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-[#ec4899]/20 flex-shrink-0" />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-6 border-t border-white/10 space-y-3">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500 hover:bg-purple-500/90 text-white font-medium transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span>Send Encrypted Message</span>
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 hover:bg-[#10b981]/20 text-[#10b981] text-sm font-medium transition-colors">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Send TRST</span>
                      </button>
                      <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#fbbf24]/10 border border-[#fbbf24]/20 hover:bg-[#fbbf24]/20 text-[#fbbf24] text-sm font-medium transition-colors">
                        <Send className="w-3.5 h-3.5" />
                        <span>Send USD</span>
                      </button>
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div className="mt-6 pt-4 border-t border-white/5 text-center">
                    <p className="text-xs text-zinc-600">
                      <Lock className="w-3 h-3 inline mr-1" />
                      Powered by XMTP · Your keys, your data
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Circle of Trust Section */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
            
            {/* Left: Circle Visualization */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#10b981]/20 to-[#fbbf24]/20 blur-3xl opacity-50" />
              <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#10b981]/30 rounded-2xl p-12">
                {/* Circle of 9 */}
                <div className="relative w-full aspect-square max-w-sm mx-auto">
                  {/* Center (You) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#10b981] to-[#fbbf24] flex items-center justify-center shadow-lg">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-white whitespace-nowrap">You</div>
                  </div>
                  
                  {/* Circle Members (8 positions) */}
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                    const angle = (i * 360) / 8 - 90;
                    const radius = 45;
                    const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
                    const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
                    const isEmpty = i >= 6;
                    
                    return (
                      <div
                        key={i}
                        className="absolute"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isEmpty 
                            ? 'border-2 border-dashed border-zinc-700'
                            : 'bg-gradient-to-br from-[#10b981]/20 to-[#fbbf24]/20 border-2 border-[#10b981]/30'
                        }`}>
                          {!isEmpty && <Users className="w-5 h-5 text-[#10b981]" />}
                        </div>
                        {/* Connection line */}
                        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" width="200" height="200" style={{ zIndex: -1 }}>
                          <line
                            x1="100"
                            y1="100"
                            x2={100 + (x - 50) * 2}
                            y2={100 + (y - 50) * 2}
                            stroke={isEmpty ? '#3f3f46' : '#10b981'}
                            strokeWidth="1"
                            strokeDasharray={isEmpty ? '4 4' : '0'}
                            opacity="0.3"
                          />
                        </svg>
                      </div>
                    );
                  })}
                </div>
                
                {/* Counter */}
                <div className="text-center mt-12 pt-8 border-t border-white/10">
                  <div className="text-3xl font-medium text-white">6 <span className="text-zinc-600">/</span> <span className="text-zinc-500">9</span></div>
                  <div className="text-sm text-zinc-500 mt-1">Trusted Members</div>
                </div>
              </div>
            </div>

            {/* Right: Explanation */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/20">
                <Shield className="w-3 h-3 text-[#10b981]" />
                <span className="text-xs font-medium text-[#10b981]">Bounded Trust</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-light tracking-tight">
                Your Circle of Trust.
                <br />
                <span className="text-[#10b981]">Limited by Design.</span>
              </h2>
              <p className="text-lg text-zinc-400 leading-relaxed">
                TrustMesh enforces a <strong className="text-white">maximum of 9 trusted contacts</strong> in your inner circle. This constraint is based on <strong className="text-white">Mark Braverman's bounded dynamical networks</strong> research at Princeton—limiting connection density creates stronger, more meaningful trust bonds.
              </p>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="w-4 h-4 text-[#10b981]" />
                  </div>
                  <div>
                    <div className="text-base font-medium text-white">Choose Wisely</div>
                    <div className="text-sm text-zinc-500 mt-0.5">Scarcity forces intentionality. Every slot matters.</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="w-4 h-4 text-[#10b981]" />
                  </div>
                  <div>
                    <div className="text-base font-medium text-white">Network Protection</div>
                    <div className="text-sm text-zinc-500 mt-0.5">Bounded trust prevents Sybil attacks and spam.</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Zap className="w-4 h-4 text-[#10b981]" />
                  </div>
                  <div>
                    <div className="text-base font-medium text-white">Quality Over Quantity</div>
                    <div className="text-sm text-zinc-500 mt-0.5">Deep trust, not shallow connections.</div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <p className="text-xs text-zinc-600">
                  Research: Braverman, M. (Princeton) · <em>Bounded Dynamical Networks</em> · Award-winning computational complexity theory
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Narrative Section: Own Your Future */}
      <div className="border-t border-white/5 bg-gradient-to-b from-[#0a0a0a] to-black">
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
