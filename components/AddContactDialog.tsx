"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import QRCode from "qrcode"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, Camera, Check, Copy, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { hederaClient } from "@/packages/hedera/HederaClient"
import { signalsStore, type SignalEvent } from "@/lib/stores/signalsStore"
import { getSessionProfile } from "@/lib/session"
import { hashContactRequest } from "@/lib/crypto/hash"

// ---- ENV & flags ----
const HCS_ENABLED = (process.env.NEXT_PUBLIC_HCS_ENABLED ?? "false") === "true"
const CONTACT_TOPIC = process.env.NEXT_PUBLIC_TOPIC_CONTACT || ""

// Background submit helper with HCS protection for seed data
async function submitContactToHCS(envelope: any, signalEvent: SignalEvent, signalId?: string) {
  if (!HCS_ENABLED || !CONTACT_TOPIC) return
  // Demo filtering removed in Step 5: Demo removal
  
  try {
    await hederaClient.submitMessage(CONTACT_TOPIC, JSON.stringify(envelope))
    if (signalId) {
      signalsStore.updateSignalStatus(signalId, "onchain")
    }
    toast.success("On-chain ✓", { description: `CONTACT …${CONTACT_TOPIC.slice(-6)}` })
  } catch (e: any) {
    if (signalId) {
      signalsStore.updateSignalStatus(signalId, "error")
    }
    toast.error("On-chain submit failed", { description: e?.message ?? "Unknown error" })
  }
}

export function AddContactDialog({ children, handle }: { children?: React.ReactNode; handle?: string }) {
  const [open, setOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState("")      // base64 JSON
  const [scanResult, setScanResult] = useState<string>("")
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [sessionProfile, setSessionProfile] = useState<any>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [detectorSupported, setDetectorSupported] = useState(false)

  // Load session profile on mount
  useEffect(() => {
    getSessionProfile().then(setSessionProfile)
  }, [])

  // Build HCS-11 compliant envelope using session profile
  const inviteEnvelope = useMemo(() => {
    if (!sessionProfile) return null
    
    return {
      type: "CONTACT_REQUEST",
      from: sessionProfile.sessionId,
      nonce: Date.now(),
      ts: Math.floor(Date.now() / 1000),
      payload: {
        to: "peer:unknown", // filled in by receiver
        fromProfileId: sessionProfile.sessionId,
        fromProfileHrl: sessionProfile.profileHrl,
        handle: sessionProfile.handle
      },
      sig: "demo_signature"
    }
  }, [sessionProfile])

  // Base64 encode envelope for QR
  const invitePayload = useMemo(() => {
    if (!inviteEnvelope) return ""
    return btoa(JSON.stringify(inviteEnvelope))
  }, [inviteEnvelope])

  // Generate QR code
  useEffect(() => {
    if (invitePayload) {
      QRCode.toDataURL(invitePayload, { margin: 1, width: 192 })
        .then(setQrDataUrl)
        .catch(console.error)
    }
  }, [invitePayload])

  // Emit local "request (outbound)" when dialog opens (sender perspective)
  useEffect(() => {
    if (!open || !inviteEnvelope) return
    
    const signalEvent: SignalEvent = {
      id: `contact_request_${inviteEnvelope.nonce}`,
      class: "contact",
      topicType: "CONTACT",
      direction: "outbound",
      actors: { from: inviteEnvelope.from, to: "peer:unknown" },
      payload: inviteEnvelope.payload,
      ts: Date.now(),
      status: "local",
      seen: false,
      type: "CONTACT_REQUEST"
    }
    
    signalsStore.addSignal(signalEvent)
    setInviteCode(invitePayload)
    
    // Background HCS submit if enabled
    if (HCS_ENABLED && CONTACT_TOPIC) {
      submitContactToHCS(inviteEnvelope, signalEvent, signalEvent.id)
    }
  }, [open, inviteEnvelope, invitePayload])

  // Camera / BarcodeDetector
  useEffect(() => {
    // @ts-expect-error
    const supported = "BarcodeDetector" in window
    setDetectorSupported(supported)
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraReady(true)
        // @ts-expect-error
        const BarcodeDetectorCtor = window.BarcodeDetector
        const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] })
        const tick = async () => {
          if (!videoRef.current) return
          try {
            const bitmap = await createImageBitmap(videoRef.current)
            const codes = await detector.detect(bitmap as any)
            if (codes && codes[0]?.rawValue) {
              onDecoded(codes[0].rawValue)
            } else {
              requestAnimationFrame(tick)
            }
          } catch {
            requestAnimationFrame(tick)
          }
        }
        requestAnimationFrame(tick)
      }
    } catch (e) {
      toast.error("Camera not available", { description: "Use Paste code instead." })
    }
  }

  function onDecoded(raw: string) {
    // Accept base64 JSON or raw JSON
    let decoded = raw
    try {
      if (!raw.trim().startsWith("{")) decoded = atob(raw.trim())
      const obj = JSON.parse(decoded)
      if (obj?.type !== "CONTACT_REQUEST" || !obj?.from) throw new Error("Invalid invite")
      setScanResult(JSON.stringify(obj))
      
      // Log inbound request to signals store
      const signalEvent: SignalEvent = {
        id: `contact_request_inbound_${obj.nonce}`,
        class: "contact",
        topicType: "CONTACT",
        direction: "inbound",
        actors: { from: obj.from, to: sessionProfile?.sessionId || "unknown" },
        payload: obj.payload,
        ts: Date.now(),
        status: "local",
        seen: false,
        type: "CONTACT_REQUEST"
      }
      
      signalsStore.addSignal(signalEvent)
      toast.success("Contact request received")
    } catch (e: any) {
      toast.error("Invalid invite", { description: e?.message ?? "Parse error" })
    }
  }

  async function acceptContact() {
    if (!scanResult || !sessionProfile) return
    const req = JSON.parse(scanResult)
    
    // Build proper CONTACT_ACCEPT envelope with hash verification
    const reqHash = hashContactRequest(req)
    const envelope = {
      type: "CONTACT_ACCEPT",
      from: sessionProfile.sessionId,
      nonce: Date.now(),
      ts: Math.floor(Date.now() / 1000),
      payload: {
        of: reqHash,
        to: req.from,
        toProfileId: sessionProfile.sessionId,
        toProfileHrl: sessionProfile.profileHrl,
        handle: sessionProfile.handle
      },
      sig: "demo_signature"
    }
    
    // Add to signals store
    const signalEvent: SignalEvent = {
      id: `contact_accept_${envelope.nonce}`,
      class: "contact",
      topicType: "CONTACT",
      direction: "outbound",
      actors: { from: sessionProfile.sessionId, to: req.from },
      payload: envelope.payload,
      ts: Date.now(),
      status: "local",
      seen: false,
      type: "CONTACT_ACCEPT"
    }
    
    signalsStore.addSignal(signalEvent)
    toast.success("Contact bonded", { description: "You can now allocate trust." })

    // Background HCS submit if enabled
    if (HCS_ENABLED && CONTACT_TOPIC) {
      submitContactToHCS(envelope, signalEvent, signalEvent.id)
    }

    setOpen(false)
  }

  return (
    <>
      {/* Trigger Element */}
      {children && (
        <div onClick={() => setOpen(true)}>
          {children}
        </div>
      )}
      
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
            max-w-sm w-full max-h-[85vh] overflow-y-auto 
            bg-gradient-to-br from-slate-900/85 to-slate-800/80 
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
              className="absolute top-3 right-3 w-6 h-6 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="sr-only">Close</span>
            </button>
            {/* Modal Header */}
            <div className="mb-4 pb-3 border-b border-[#FF6B35]/20">
              <h2 className="text-white text-xl font-bold bg-gradient-to-r from-white to-[#FF6B35] bg-clip-text text-transparent flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35]/30 to-emerald-500/30 flex items-center justify-center border border-[#FF6B35]/30 shadow-lg">
                  <QrCode className="w-4 h-4 text-[#FF6B35]" />
                </div>
                QR Exchange
              </h2>
            </div>

        <Tabs defaultValue="mine" className="w-full">
          <TabsList className="grid grid-cols-2 mb-3 bg-white/5 border border-white/10">
            <TabsTrigger 
              value="mine" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6B35]/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-white data-[state=active]:border-[#FF6B35]/30"
            >
              <QrCode className="w-4 h-4 mr-2" /> Share My QR
            </TabsTrigger>
            <TabsTrigger 
              value="scan"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-[#FF6B35]/20 data-[state=active]:text-white data-[state=active]:border-emerald-500/30"
            >
              <Camera className="w-4 h-4 mr-2" /> Scan QR
            </TabsTrigger>
          </TabsList>

          {/* My QR */}
          <TabsContent value="mine" className="space-y-3">
            <div className="backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-[#FF6B35]/20 rounded-lg p-4 flex flex-col items-center relative overflow-hidden">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/5 to-emerald-500/5 animate-pulse rounded-lg" />
              
              <div className="w-36 h-36 bg-white/95 rounded-lg flex items-center justify-center mb-3 shadow-2xl border-2 border-[#FF6B35]/30 relative z-10">
                {qrDataUrl ? (
                  <>
                    <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain p-2 rounded-lg" />
                    {/* Subtle scanning corners */}
                    <div className="absolute inset-1 border-2 border-transparent">
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#FF6B35]/60 animate-pulse" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400/60 animate-pulse" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400/60 animate-pulse" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#FF6B35]/60 animate-pulse" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-slate-600">
                    <div className="w-5 h-5 border-2 border-[#FF6B35] rounded-full border-t-transparent animate-spin mb-2" />
                    <div className="text-sm font-medium">Generating QR...</div>
                  </div>
                )}
              </div>
              
              {/* Subtle glow around QR */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35]/10 to-emerald-500/10 rounded-lg blur-lg -z-10 animate-pulse" />
              
              <div className="w-full space-y-2 relative z-10">
                <Label className="text-sm font-medium text-white/80">Share Code</Label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={inviteCode} 
                    className="text-xs font-mono bg-white/5 border-white/10 text-white/70 focus:border-[#FF6B35]/50" 
                  />
                  <Button 
                    type="button" 
                    size="sm"
                    className="bg-gradient-to-r from-[#FF6B35]/80 to-cyan-500/80 hover:from-[#FF6B35] hover:to-cyan-500 text-white font-medium shadow-lg border border-[#FF6B35]/40"
                    onClick={() => { 
                      navigator.clipboard.writeText(inviteCode)
                      toast.success("Copied!", { description: "Share with your contact" })
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-white/50 text-center">Others can scan or paste this code to connect</p>
              </div>
            </div>
            
            {/* Status indicator */}
            {!CONTACT_TOPIC && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-xs">Demo Mode - Local only</span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Scan - Mobile Optimized */}
          <TabsContent value="scan" className="space-y-4">
            {detectorSupported ? (
              <div className="space-y-4 w-full">
                {/* Camera Section */}
                <div className="backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-emerald-500/20 rounded-lg p-4 relative overflow-hidden w-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-[#FF6B35]/5 animate-pulse" />
                  
                  <video 
                    ref={videoRef} 
                    playsInline 
                    muted 
                    className="w-full rounded-lg bg-black/20 aspect-video border-2 border-emerald-500/20 shadow-lg" 
                  />
                  
                  {/* Scanning overlay */}
                  {cameraReady && (
                    <div className="absolute inset-3">
                      <div className="relative w-full h-full">
                        <div className="absolute inset-1/4 border-2 border-transparent">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 animate-pulse" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400 animate-pulse" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 animate-pulse" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 animate-pulse" />
                        </div>
                        {/* Scanning line */}
                        <div className="absolute inset-x-1/4 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 flex justify-center">
                    <Button 
                      type="button" 
                      onClick={startCamera} 
                      className="bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-700 hover:from-emerald-500 hover:via-green-400 hover:to-emerald-600 text-white font-bold px-4 py-2 shadow-2xl shadow-emerald-500/40 animate-pulse border-2 border-emerald-400/50"
                    >
                      <Camera className="w-4 h-4 mr-2 drop-shadow-lg" /> 
                      {cameraReady ? "🔍 Scanning for QR codes..." : "📱 Start Camera Scan"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <Camera className="w-6 h-6 mx-auto mb-2 text-white/40" />
                <p className="text-sm text-white/60">Camera scanning not available on this device</p>
                <p className="text-xs text-white/40 mt-1">Use the paste option below instead</p>
              </div>
            )}
            
            {/* Manual Input Section */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-4 space-y-4 w-full">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="w-4 h-4 text-[#FF6B35]" />
                <Label className="text-sm font-medium text-white">Paste Contact Code</Label>
              </div>
              <Input 
                placeholder="Paste the contact's invite code here..." 
                onChange={(e) => setScanResult(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#FF6B35]/50" 
              />
              <div className="flex gap-2 pt-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onDecoded(scanResult)}
                  className="flex-1 border-white/20 text-white/80 hover:bg-white/10"
                >
                  Validate Code
                </Button>
                <Button 
                  type="button" 
                  className="flex-1 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-700 hover:from-emerald-500 hover:via-green-400 hover:to-emerald-600 text-white font-bold shadow-2xl shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse border-2 border-emerald-400/60" 
                  disabled={!scanResult || !scanResult.length} 
                  onClick={acceptContact}
                >
                  <Check className="w-4 h-4 mr-2 drop-shadow-lg" /> 
                  🔗 Bond Contact
                </Button>
              </div>
              <p className="text-xs text-white/50 text-center mt-1">
                Accepting creates a verified professional connection on the blockchain
              </p>
            </div>
          </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>, document.body
      )}
    </>
  )
}