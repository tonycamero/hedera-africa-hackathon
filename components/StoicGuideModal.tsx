"use client"

import React, { useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface StoicGuideModalProps {
  children: React.ReactNode
  availableSlots: number
  onAddMember: (type: string) => void
}

export function StoicGuideModal({ children, availableSlots, onAddMember }: StoicGuideModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger Element */}
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>
      
      {/* Custom Modal */}
      {!open || typeof document === 'undefined' ? null : createPortal(
        <div className="fixed inset-0 z-50">
          {/* Custom Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md animate-in fade-in-0 duration-300"
            onClick={() => setOpen(false)}
          />
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto animate-in zoom-in-90 fade-in-0 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
              <div className="
                max-w-md w-full max-h-[85vh] overflow-y-auto 
                bg-gradient-to-br from-[#1a0a1f]/95 to-[#2a1030]/90 
                backdrop-blur-xl 
                border-2 border-[#FF6B35]/40 
                shadow-[0_0_40px_rgba(255,107,53,0.3),0_0_80px_rgba(255,107,53,0.1)] 
                rounded-[10px] p-4
                relative
                before:absolute before:inset-0 before:rounded-[10px] before:p-[2px]
                before:bg-gradient-to-r before:from-[#FF6B35]/50 before:via-transparent before:to-[#FF6B35]/50
                before:-z-10 before:animate-pulse
              ">
                {/* Close Button */}
                <button
                  onClick={() => setOpen(false)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:ring-offset-2 focus:ring-offset-[#1a0a1f]"
                >
                  <X className="w-4 h-4 text-white" />
                  <span className="sr-only">Close</span>
                </button>

                {/* Modal Header */}
                <div className="mb-4 pb-3 border-b border-[#FF6B35]/20">
                  <h2 className="text-white text-lg font-bold bg-gradient-to-r from-white to-[#FF6B35] bg-clip-text text-transparent text-center">
                    Who Should You Add?
                  </h2>
                  <p className="text-xs text-white/60 text-center mt-1">(Stoic Guide)</p>
                </div>

                {/* 3-Column Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2 bg-black/30 rounded-lg border border-emerald-500/30">
                    <div className="text-center mb-2">
                      <span className="text-xs font-medium text-emerald-400 block mb-1">Mentors</span>
                      <span className="text-xs text-emerald-400/80">Wisdom Anchors</span>
                    </div>
                    <p className="text-xs text-white/60 text-center mb-2">Experienced guides with proven track records</p>
                    <Button 
                      size="sm"
                      className="w-full h-6 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                      onClick={() => {
                        onAddMember('mentor')
                        setOpen(false)
                      }}
                    >
                      Suggest
                    </Button>
                  </div>
                  
                  <div className="p-2 bg-black/30 rounded-lg border border-blue-500/30">
                    <div className="text-center mb-2">
                      <span className="text-xs font-medium text-blue-400 block mb-1">Collaborators</span>
                      <span className="text-xs text-blue-400/80">Execution Partners</span>
                    </div>
                    <p className="text-xs text-white/60 text-center mb-2">Reliable co-builders with supporting skills</p>
                    <Button 
                      size="sm"
                      className="w-full h-6 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                      onClick={() => {
                        onAddMember('collaborator')
                        setOpen(false)
                      }}
                    >
                      Search
                    </Button>
                  </div>
                  
                  <div className="p-2 bg-black/30 rounded-lg border border-yellow-500/30">
                    <div className="text-center mb-2">
                      <span className="text-xs font-medium text-yellow-400 block mb-1">Allies</span>
                      <span className="text-xs text-yellow-400/80">Discipline Enforcers</span>
                    </div>
                    <p className="text-xs text-white/60 text-center mb-2">Peers who hold you to standards</p>
                    <Button 
                      size="sm"
                      className="w-full h-6 text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30"
                      onClick={() => {
                        onAddMember('ally')
                        setOpen(false)
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                
                {/* Wildcards - only show when almost full */}
                {availableSlots <= 1 && (
                  <div className="mb-4">
                    <div className="p-3 bg-slate-800 rounded-lg border border-purple-500/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-purple-400">Wildcards: Edge Providers</span>
                        <Button 
                          size="sm"
                          className="h-6 px-2 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
                          onClick={() => {
                            onAddMember('wildcard')
                            setOpen(false)
                          }}
                        >
                          Consider
                        </Button>
                      </div>
                      <p className="text-xs text-white/60">Contrarians and cross-discipline experts. Use sparingly.</p>
                    </div>
                  </div>
                )}
                
                {/* Remember Section */}
                <div className="p-2 bg-[#FF6B35]/10 rounded-lg border border-[#FF6B35]/20">
                  <p className="text-xs text-[#FF6B35] font-medium">Remember:</p>
                  <p className="text-xs text-white/70 mt-1">With only 9 slots, each addition is a calculated investment. Choose people who amplify your capabilities and support your goals.</p>
                </div>
              </div>
            </div>
          </div>
        </div>, document.body
      )}
    </>
  )
}