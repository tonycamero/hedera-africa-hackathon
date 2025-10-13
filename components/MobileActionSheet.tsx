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
          rounded-t-2xl border-t border-white/10
          bg-gradient-to-b from-slate-900/95 to-slate-900/85 backdrop-blur-xl
          data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-8
          data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-8
          sm:rounded-t-2xl
          translate-x-0 translate-y-0
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
        <div className="p-4">{children}</div>
        <div className="h-4" />
      </DialogContent>
    </Dialog>
  )
}