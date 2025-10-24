"use client"

import * as React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export function MobileActionSheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          fixed bottom-0 left-0 right-0 w-full max-w-none p-0
          rounded-t-2xl border-t-2 border-l border-r border-[#00F6FF]/30
          bg-gradient-to-br from-slate-900/95 to-slate-800/90 backdrop-blur-xl
          shadow-[0_0_30px_rgba(0,246,255,0.2),0_0_60px_rgba(0,246,255,0.1)]
          data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-8
          data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-8
          sm:rounded-t-2xl
          translate-x-0 translate-y-0
          relative
          before:absolute before:inset-0 before:rounded-t-2xl before:p-[1px]
          before:bg-gradient-to-r before:from-[#00F6FF]/30 before:via-transparent before:to-[#00F6FF]/30
          before:-z-10 before:animate-pulse
        "
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          transform: 'none',
          margin: 0
        }}
      >
        <div className="p-4 max-h-[95vh] overflow-y-auto">{children}</div>
        <div className="h-4 flex-shrink-0" />
      </DialogContent>
    </Dialog>
  )
}