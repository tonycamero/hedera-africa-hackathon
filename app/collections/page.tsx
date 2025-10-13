'use client'

import React from 'react'
import { ArrowLeft, Search, Filter, Sparkles } from 'lucide-react'

// Sample signal templates organized by categories
const SIGNAL_COLLECTIONS = {
  'Work & Performance': [
    { template: 'That presentation was ___', examples: ['absolutely killer!', 'pure genius', 'flawless execution'] },
    { template: 'Your ___ game is unmatched', examples: ['coding', 'problem-solving', 'leadership'] },
    { template: 'You absolutely ___', examples: ['nailed it', 'crushed that deadline', 'saved the day'] }
  ],
  'Social & Networking': [
    { template: 'That was ___ energy', examples: ['pure main character', 'total boss vibes', 'magnetic'] },
    { template: 'Your ___ is iconic', examples: ['networking game', 'confidence', 'authenticity'] },
    { template: 'You just ___', examples: ['owned that room', 'made everyone smile', 'raised the vibe'] }
  ],
  'Creative & Innovation': [
    { template: 'That ___ was revolutionary', examples: ['design', 'idea', 'concept'] },
    { template: 'Your creativity is ___', examples: ['off the charts', 'mind-blowing', 'inspiring'] },
    { template: 'You made ___ look effortless', examples: ['innovation', 'art', 'genius'] }
  ],
  'Support & Kindness': [
    { template: 'Thank you for ___', examples: ['being there', 'listening', 'caring so much'] },
    { template: 'Your support was ___', examples: ['everything', 'life-changing', 'exactly what I needed'] },
    { template: 'You have a gift for ___', examples: ['making people feel valued', 'bringing out the best', 'healing hearts'] }
  ]
}

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          
          <div>
            <h1 className="text-3xl font-bold text-white">Signal Collections</h1>
            <p className="text-purple-200">Browse templates to inspire your recognition</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 h-4 w-4" />
            <input
              type="text"
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-purple-300 focus:outline-none focus:border-white/40"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        {/* Collections Grid */}
        <div className="space-y-8">
          {Object.entries(SIGNAL_COLLECTIONS).map(([category, templates]) => (
            <div key={category} className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                {category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
                    <div className="text-white font-medium mb-3">
                      "{template.template.replace('___', '___________')}"
                    </div>
                    <div className="space-y-2">
                      {template.examples.map((example, i) => (
                        <div key={i} className="text-sm text-purple-200 bg-purple-500/20 px-3 py-1 rounded-full">
                          "{template.template.replace('___', example)}"
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Send Your First Signal?</h3>
            <p className="text-purple-200 mb-6">Join TrustMesh to start recognizing others and building your network</p>
            <button
              onClick={() => window.open('/signup?intent=create_signal', '_blank')}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-full text-white font-medium transition-all hover:scale-105 shadow-lg"
            >
              Create Account & Start Sending
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}