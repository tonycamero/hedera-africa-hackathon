"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface InsufficientTrstModalProps {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  requiredAmount: number
  action: string
}

export function InsufficientTrstModal({
  isOpen,
  onClose,
  currentBalance,
  requiredAmount,
  action
}: InsufficientTrstModalProps) {
  if (!isOpen) return null

  const shortfall = requiredAmount - currentBalance

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-50 w-full max-w-md p-6 modal-magenta-base sheen-sweep modal-magenta-border rounded-lg shadow-2xl animate-in zoom-in-95">
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-amber-500/20 border-2 border-amber-500/40 rounded-full">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-bold text-center text-white mb-2">
          Insufficient TRST Balance
        </h2>
        
        {/* Message */}
        <div className="space-y-3 mb-6">
          <p className="text-sm text-white/70 text-center">
            You need more TRST to complete this action.
          </p>
          
          {/* Balance Info */}
          <div className="p-4 bg-black/30 border border-white/10 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Action:</span>
              <span className="text-white font-medium">{action}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Required:</span>
              <span className="text-emerald-400 font-medium">{requiredAmount.toFixed(2)} TRST</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Your Balance:</span>
              <span className="text-amber-400 font-medium">{currentBalance.toFixed(2)} TRST</span>
            </div>
            <div className="pt-2 border-t border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Shortfall:</span>
                <span className="text-red-400 font-bold">{shortfall.toFixed(2)} TRST</span>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-white/50 text-center">
            💎 TRST tokens enable premium features and network participation
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-white/20 text-white/80 hover:bg-white/10"
          >
            Later
          </Button>
          <Button
            onClick={() => {
              // TODO: Navigate to earn/purchase TRST flow
              onClose()
            }}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-medium"
            disabled
          >
            Earn TRST (Coming Soon)
          </Button>
        </div>
      </div>
    </div>
  )
}
