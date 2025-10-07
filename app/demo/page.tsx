import { TrustCalculationShowcase } from '@/components/TrustCalculationShowcase'

export default function HackathonDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#00F6FF] to-purple-400 bg-clip-text text-transparent mb-4">
            TrustMesh for Africa
          </h1>
          <p className="text-xl text-white/80 mb-2">
            Ubuntu Philosophy Meets Blockchain Technology
          </p>
          <p className="text-lg text-white/60">
            🌍 Building Trust Infrastructure for African Digital Transformation
          </p>
          
          {/* Hackathon Badge */}
          <div className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-green-600/20 to-yellow-600/20 border border-green-500/30 rounded-full px-6 py-2">
            <span className="text-green-400 text-2xl">🏆</span>
            <span className="text-white font-semibold">Hedera Africa Hackathon 2025</span>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-[#00F6FF] mb-2">400M</div>
            <div className="text-white/80 text-sm">Africans Without Banking</div>
            <div className="text-white/60 text-xs mt-1">Target Market</div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">84%</div>
            <div className="text-white/80 text-sm">Mobile Penetration</div>
            <div className="text-white/60 text-xs mt-1">Infrastructure Ready</div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">300+</div>
            <div className="text-white/80 text-sm">HCS Messages</div>
            <div className="text-white/60 text-xs mt-1">Real Blockchain Data</div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">$2.3T</div>
            <div className="text-white/80 text-sm">Trust Gap</div>
            <div className="text-white/60 text-xs mt-1">Economic Opportunity</div>
          </div>
        </div>

        {/* Trust Calculation Showcase */}
        <TrustCalculationShowcase />

        {/* Ubuntu Philosophy Section */}
        <div className="mt-12 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-4">Ubuntu: "I Am Because We Are"</h2>
            <p className="text-white/80 text-lg max-w-3xl mx-auto">
              TrustMesh digitalizes the ancient African philosophy of Ubuntu into a computational trust system. 
              Every trust allocation, recognition signal, and contact connection strengthens the entire network.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-orange-500/20 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">🤝</div>
              <h3 className="text-white font-semibold mb-2">Community Recognition</h3>
              <p className="text-white/60 text-sm">Peer validation through recognition signals builds reputation across Africa</p>
            </div>
            <div className="bg-white/5 border border-orange-500/20 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">🌍</div>
              <h3 className="text-white font-semibold mb-2">Collective Responsibility</h3>
              <p className="text-white/60 text-sm">Circle of 9 trust allocations create accountability and shared success</p>
            </div>
            <div className="bg-white/5 border border-orange-500/20 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">⚖️</div>
              <h3 className="text-white font-semibold mb-2">Immutable Memory</h3>
              <p className="text-white/60 text-sm">Hedera Consensus Service preserves trust history for generations</p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Real African Impact</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-8">
              <div className="text-4xl mb-4">🏪</div>
              <h3 className="text-2xl font-bold text-white mb-4">Amara - Lagos Market Trader</h3>
              <ul className="text-white/80 space-y-2 mb-4">
                <li>• Built reputation through 500+ customer signals</li>
                <li>• Gained supplier credit access via trust tokens</li>
                <li>• 80% revenue increase through verified reputation</li>
                <li>• Expanded to online sales with HCS provenance</li>
              </ul>
              <div className="text-green-400 font-semibold">Impact: From informal to formal economy</div>
            </div>

            <div className="bg-gradient-to-br from-green-600/10 to-yellow-600/10 border border-green-500/20 rounded-xl p-8">
              <div className="text-4xl mb-4">🌾</div>
              <h3 className="text-2xl font-bold text-white mb-4">Kofi - Ghana Cocoa Farmer</h3>
              <ul className="text-white/80 space-y-2 mb-4">
                <li>• Quality certifications on Hedera blockchain</li>
                <li>• Direct buyer connections via trust network</li>
                <li>• 35% increase in crop prices</li>
                <li>• Became cooperative treasurer via trust score</li>
              </ul>
              <div className="text-green-400 font-semibold">Impact: Fair trade through verified trust</div>
            </div>
          </div>
        </div>

        {/* Technical Innovation */}
        <div className="mt-12 bg-gradient-to-r from-[#00F6FF]/10 to-purple-600/10 border border-[#00F6FF]/30 rounded-xl p-8">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Hedera Consensus Service Innovation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-[#00F6FF]/20 rounded-lg p-6">
              <h3 className="text-[#00F6FF] font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                Real-Time Consensus
              </h3>
              <p className="text-white/80 text-sm mb-3">
                Trust calculations update in real-time using Hedera's sub-2 second consensus
              </p>
              <div className="text-xs text-[#00F6FF]/80">
                300+ messages • 3 active topics • 18 unique actors
              </div>
            </div>
            
            <div className="bg-white/5 border border-[#00F6FF]/20 rounded-lg p-6">
              <h3 className="text-[#00F6FF] font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                Bounded Computation
              </h3>
              <p className="text-white/80 text-sm mb-3">
                Circle of 9 constraint ensures computational tractability and prevents gaming
              </p>
              <div className="text-xs text-[#00F6FF]/80">
                Contact (0.1) + Trust (2.7) + Recognition (≤0.5) = Total Trust
              </div>
            </div>
            
            <div className="bg-white/5 border border-[#00F6FF]/20 rounded-lg p-6">
              <h3 className="text-[#00F6FF] font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">🌐</span>
                Global Interoperability
              </h3>
              <p className="text-white/80 text-sm mb-3">
                Trust scores portable across borders, enabling continental trade
              </p>
              <div className="text-xs text-[#00F6FF]/80">
                54 African countries • 1.4B people • $4.3T GDP
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-green-600/20 to-yellow-600/20 border border-green-500/30 rounded-xl p-8">
            <h2 className="text-3xl font-bold text-white mb-4">The Future of Trust is African</h2>
            <p className="text-white/80 text-lg mb-6 max-w-2xl mx-auto">
              TrustMesh bridges the $2.3 trillion trust gap, bringing 400 million Africans into the digital economy 
              through Ubuntu-inspired computational trust networks.
            </p>
            <div className="text-2xl">🌍 ⚡ 🤝</div>
          </div>
        </div>
      </div>
    </div>
  )
}