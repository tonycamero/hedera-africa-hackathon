"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function CirclePage() {
  const router = useRouter()
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  const handleMemberClick = (memberId: string) => {
    console.log('🖱️ Member clicked:', memberId)
    setSelectedMember(memberId)
    toast.info(`Opening profile for ${memberId}`)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-medium text-white mb-2 tracking-tight">
          Your Circle of Trust (6/9)
        </h1>
        <p className="text-white/60">Click handlers are now working!</p>
      </div>

      {/* Interactive test buttons */}
      <div className="flex justify-center gap-4">
        <Button 
          className="bg-transparent border border-[#00F6FF] text-[#00F6FF] hover:bg-[#00F6FF]/10"
          onClick={() => {
            console.log('📡 Send Signal clicked')
            toast.success('Signal sent!', { description: 'Your signal has been broadcast' })
          }}
        >
          Send Signal
        </Button>
        
        <Button 
          variant="ghost" 
          className="text-white/60 hover:text-[#00F6FF] hover:bg-[#00F6FF]/10"
          onClick={() => {
            console.log('🔄 Navigate to contacts')
            router.push('/contacts')
          }}
        >
          Manage Slots
        </Button>
      </div>

      {/* Test contact buttons */}
      <div className="flex justify-center">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8">
          <div className="grid grid-cols-3 gap-4">
            {['Alice', 'Bob', 'Carol'].map((name) => (
              <button
                key={name}
                onClick={() => handleMemberClick(`tm-${name.toLowerCase()}`)}
                className="w-16 h-16 rounded-full border-2 border-[#00F6FF] bg-[#00F6FF]/20 hover:bg-[#00F6FF]/30 transition-all duration-300 flex items-center justify-center text-white font-medium hover:scale-110"
              >
                {name.slice(0, 2)}
              </button>
            ))}
          </div>
          <p className="text-white/60 text-sm text-center mt-4">Click the contacts above to test</p>
        </div>
      </div>
    </div>
  )
}