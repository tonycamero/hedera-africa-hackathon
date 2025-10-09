"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { X, Award } from 'lucide-react'

interface TokenDetailModalProps {
  token: any | null
  isSelected: boolean
  onClose: () => void
  onSelect: () => void
  onSend: () => void
  selectedCount: number
  sending: boolean
}

export function TokenDetailModal({ 
  token, 
  isSelected, 
  onClose, 
  onSelect, 
  onSend, 
  selectedCount,
  sending 
}: TokenDetailModalProps) {
  if (!token) return null

  const Icon = token.icon

  return (
    <div className="fixed inset-0 z-50">
      {/* Custom Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md animate-in fade-in-0 duration-300"
        onClick={onClose}
      />
      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto animate-in zoom-in-90 fade-in-0 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <div className={`
            max-w-md w-full max-h-[85vh] overflow-y-auto 
            bg-gradient-to-br from-slate-900/85 to-slate-800/80 
            backdrop-blur-xl 
            border-2 ${
              token.category === 'leadership' ? 'border-orange-400/40 shadow-[0_0_40px_rgba(251,146,60,0.3),0_0_80px_rgba(251,146,60,0.1)]' :
              token.category === 'knowledge' ? 'border-emerald-400/40 shadow-[0_0_40px_rgba(52,211,153,0.3),0_0_80px_rgba(52,211,153,0.1)]' :
              token.category === 'execution' ? 'border-purple-400/40 shadow-[0_0_40px_rgba(192,132,252,0.3),0_0_80px_rgba(192,132,252,0.1)]' : 'border-[#00F6FF]/40 shadow-[0_0_40px_rgba(0,246,255,0.3),0_0_80px_rgba(0,246,255,0.1)]'
            }
            rounded-[10px] p-6
            relative
            before:absolute before:inset-0 before:rounded-[10px] before:p-[2px]
            before:bg-gradient-to-r ${
              token.category === 'leadership' ? 'before:from-orange-400/50 before:via-transparent before:to-orange-400/50' :
              token.category === 'knowledge' ? 'before:from-emerald-400/50 before:via-transparent before:to-emerald-400/50' :
              token.category === 'execution' ? 'before:from-purple-400/50 before:via-transparent before:to-purple-400/50' : 'before:from-[#00F6FF]/50 before:via-transparent before:to-[#00F6FF]/50'
            }
            before:-z-10 before:animate-pulse
          `}>
            {/* Close Button */}
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 w-6 h-6 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 ${
                token.category === 'leadership' ? 'focus:ring-orange-400/50' :
                token.category === 'knowledge' ? 'focus:ring-emerald-400/50' :
                token.category === 'execution' ? 'focus:ring-purple-400/50' : 'focus:ring-[#00F6FF]/50'
              } focus:ring-offset-2 focus:ring-offset-slate-900`}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="sr-only">Close</span>
            </button>
            {/* Modal Header */}
            <div className={`mb-6 pb-4 border-b ${
              token.category === 'leadership' ? 'border-orange-400/20' :
              token.category === 'knowledge' ? 'border-emerald-400/20' :
              token.category === 'execution' ? 'border-purple-400/20' : 'border-[#00F6FF]/20'
            }`}>
              <h2 className={`text-white text-2xl font-bold bg-gradient-to-r from-white ${
                token.category === 'leadership' ? 'to-orange-400' :
                token.category === 'knowledge' ? 'to-emerald-400' :
                token.category === 'execution' ? 'to-purple-400' : 'to-[#00F6FF]'
              } bg-clip-text text-transparent flex items-center gap-2`}>
                <Award className={`w-5 h-5 ${
                  token.category === 'leadership' ? 'text-orange-400' :
                  token.category === 'knowledge' ? 'text-emerald-400' :
                  token.category === 'execution' ? 'text-purple-400' : 'text-[#00F6FF]'
                }`} />
                {token.name}
              </h2>
            </div>

            <div className="space-y-6">
              {/* Token Header - Like Contact Profile */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`p-4 rounded-full border-2 ${
                    token.category === 'leadership' ? 'border-orange-400/40 bg-gradient-to-br from-orange-400/20 to-orange-500/10 shadow-[0_0_20px_rgba(251,146,60,0.2)]' :
                    token.category === 'knowledge' ? 'border-emerald-400/40 bg-gradient-to-br from-emerald-400/20 to-emerald-500/10 shadow-[0_0_20px_rgba(52,211,153,0.2)]' :
                    token.category === 'execution' ? 'border-purple-400/40 bg-gradient-to-br from-purple-400/20 to-purple-500/10 shadow-[0_0_20px_rgba(192,132,252,0.2)]' : 'border-[#00F6FF]/40 bg-gradient-to-br from-[#00F6FF]/20 to-cyan-500/10 shadow-[0_0_20px_rgba(0,246,255,0.2)]'
                  } flex-shrink-0`}>
                    <Icon className={`w-8 h-8 ${
                      token.category === 'leadership' ? 'text-orange-400' :
                      token.category === 'knowledge' ? 'text-emerald-400' :
                      token.category === 'execution' ? 'text-purple-400' : 'text-[#00F6FF]'
                    }`} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      token.category === 'leadership' ? 'bg-orange-400/20 text-orange-300 border border-orange-400/30' :
                      token.category === 'knowledge' ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' :
                      token.category === 'execution' ? 'bg-purple-400/20 text-purple-300 border border-purple-400/30' : 'bg-[#00F6FF]/20 text-cyan-300 border border-[#00F6FF]/30'
                    }`}>
                      {token.category.toUpperCase()}
                    </div>
                    {isSelected && (
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-[#00F6FF]/20 text-[#00F6FF] border border-[#00F6FF]/30">
                        ✓ SELECTED
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span>{token.trustValue} trust units</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description - Like Contact Bio */}
              <div className={`p-4 rounded-[8px] border backdrop-blur-sm ${
                token.category === 'leadership' ? 'bg-orange-500/5 border-orange-400/10' :
                token.category === 'knowledge' ? 'bg-emerald-500/5 border-emerald-400/10' :
                token.category === 'execution' ? 'bg-purple-500/5 border-purple-400/10' : 'bg-[#00F6FF]/5 border-[#00F6FF]/10'
              }`}>
                <p className="text-white/90 leading-relaxed text-sm">{token.description}</p>
              </div>

              {/* Action Buttons - Professional Style */}
              <div className="flex gap-3">
                <Button
                  onClick={onSelect}
                  className={`flex-1 transition-all font-medium ${
                    isSelected 
                      ? `${
                          token.category === 'leadership' ? 'bg-orange-400/20 text-orange-300 border border-orange-400/50 hover:bg-orange-400/30' :
                          token.category === 'knowledge' ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/50 hover:bg-emerald-400/30' :
                          token.category === 'execution' ? 'bg-purple-400/20 text-purple-300 border border-purple-400/50 hover:bg-purple-400/30' : 'bg-[#00F6FF]/20 text-[#00F6FF] border border-[#00F6FF]/50 hover:bg-[#00F6FF]/30'
                        }` 
                      : `${
                          token.category === 'leadership' ? 'bg-orange-400 text-black hover:bg-orange-400/80' :
                          token.category === 'knowledge' ? 'bg-emerald-400 text-black hover:bg-emerald-400/80' :
                          token.category === 'execution' ? 'bg-purple-400 text-black hover:bg-purple-400/80' : 'bg-[#00F6FF] text-black hover:bg-[#00F6FF]/80'
                        }`
                  }`}
                >
                  {isSelected ? '✓ Selected' : 'Select This Token'}
                </Button>
                <Button
                  onClick={onSend}
                  disabled={selectedCount === 0 || sending}
                  className="flex-1 bg-gradient-to-r from-[#00F6FF] to-cyan-500 hover:from-[#00F6FF]/90 hover:to-cyan-500/90 text-black font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>Send this Signal!</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}