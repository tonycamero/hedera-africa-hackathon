'use client'

import React, { useState } from 'react'
import { ArrowLeft, Mail, User, Sparkles, MessageSquare, Users, Shield } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [handle, setHandle] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Mock signup process
    setTimeout(() => {
      setStep(2)
      setIsLoading(false)
    }, 2000)
  }

  const handleCreateSignal = () => {
    // Mock signal creation
    setStep(3)
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-white mb-4">Welcome to TrustMesh!</h1>
            <p className="text-purple-200 mb-8">
              Your account is ready. Start recognizing others and building meaningful connections.
            </p>
            
            <div className="space-y-4">
              <button 
                onClick={() => window.open('/send', '_blank')}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-500 rounded-full text-white font-medium hover:scale-105 transition-all shadow-lg"
              >
                <MessageSquare className="h-5 w-5 inline mr-2" />
                Send Your First Signal
              </button>
              
              <button 
                onClick={() => window.open('/dashboard', '_blank')}
                className="w-full px-6 py-4 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition-all"
              >
                <Users className="h-5 w-5 inline mr-2" />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">✨</div>
              <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
              <p className="text-purple-200">Let's get you started with peer recognition</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                <Shield className="h-5 w-5 text-green-400" />
                <span className="text-green-300 text-sm">Blockchain identity secured</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <Users className="h-5 w-5 text-blue-400" />
                <span className="text-blue-300 text-sm">Ready to join trust networks</span>
              </div>
            </div>

            <button 
              onClick={handleCreateSignal}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-500 rounded-full text-white font-medium hover:scale-105 transition-all shadow-lg"
            >
              Start Creating Signals
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* Signup Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🔥</div>
            <h1 className="text-2xl font-bold text-white mb-2">Join TrustMesh</h1>
            <p className="text-purple-200">Start building your peer recognition network</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 h-4 w-4" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-purple-300 focus:outline-none focus:border-white/40"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Handle
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ''))}
                placeholder="username"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-purple-300 focus:outline-none focus:border-white/40"
                required
              />
              <p className="text-xs text-purple-300 mt-1">This will be your @{handle || 'username'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 h-4 w-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-purple-300 focus:outline-none focus:border-white/40"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full px-6 py-3 rounded-full font-medium transition-all ${
                isLoading 
                  ? 'bg-white/20 text-purple-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-500 to-purple-500 hover:from-purple-600 hover:to-purple-600 text-white hover:scale-105 shadow-lg'
              }`}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center justify-center gap-4 text-sm text-purple-300">
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                <span>Blockchain secured</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Privacy first</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}