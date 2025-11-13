"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import QRCode from "qrcode"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, Camera, Check, Copy, AlertTriangle, Clock } from "lucide-react"
import { toast } from "sonner"
import { hederaClient } from "@/packages/hedera/HederaClient"
import { signalsStore, type SignalEvent } from "@/lib/stores/signalsStore"
import { getSessionProfile } from "@/lib/session"
import { resolveScendIdentity } from "@/lib/identity/resolveScendIdentity"
import { hashContactRequest } from "@/lib/crypto/hash"
import { logTxClient } from "@/lib/telemetry/txLog"
import { CameraScanner } from "@/components/CameraScanner"
import {
  createContactRequest,
  verifyContactRequest,
  createContactAccept,
  createContactMirror,
  markJtiUsed,
  hashPayload,
  encodeToWebUrl,
  decodeFromUrl,
  type ContactRequestPayload
} from "@/lib/qr/secureContactRequest"

// ---- ENV & flags ----
const HCS_ENABLED = (process.env.NEXT_PUBLIC_HCS_ENABLED ?? "false") === "true"
const CONTACT_TOPIC = process.env.NEXT_PUBLIC_TOPIC_CONTACT || ""

// Background submit helper - uses server-side API
async function submitContactToHCS(payload: any, signalEvent: SignalEvent, signalId?: string) {
  if (!HCS_ENABLED || !CONTACT_TOPIC) return
  
  try {
    // Wrap payload in proper HCS envelope format
    const envelope = {
      type: payload.type,
      from: payload.from?.acct || payload.acceptor?.acct,
      nonce: Date.now(),
      ts: Math.floor(Date.now() / 1000),
      payload: payload
    }
    
    // Use server-side API instead of direct client submission
    const response = await fetch('/api/hcs/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope)
    })
    
    const result = await response.json()
    
    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Failed to submit to HCS')
    }
    
    if (signalId) {
      signalsStore.updateSignalStatus(signalId, "onchain")
    }
    
    // Log successful HCS submit
    logTxClient({
      action: envelope.type === "CONTACT_ACCEPT" ? "CONTACT_ACCEPT" : "CONTACT_REQUEST",
      status: "SUCCESS",
      topicId: CONTACT_TOPIC,
      txId: result.transactionId
    })
    
    toast.success("On-chain ✓", { description: `TX: ${result.transactionId?.slice(-8) || 'confirmed'}` })
  } catch (e: any) {
    console.error('[submitContactToHCS] Error:', e)
    if (signalId) {
      signalsStore.updateSignalStatus(signalId, "error")
    }
    
    // Log failed HCS submit
    logTxClient({
      action: payload.type === "CONTACT_ACCEPT" ? "CONTACT_ACCEPT" : "CONTACT_REQUEST",
      status: "ERROR",
      topicId: CONTACT_TOPIC,
      meta: { error: e?.message }
    })
    
    toast.error("On-chain submit failed", { description: e?.message ?? "Unknown error" })
  }
}

export function AddContactDialog({ children, handle }: { children?: React.ReactNode; handle?: string }) {
  const [open, setOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState("")      // URL with secure payload
  const [scanResult, setScanResult] = useState<string>("")  // Raw input from paste
  const [validatedInvite, setValidatedInvite] = useState<ContactRequestPayload | null>(null)  // Validated secure payload
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [sessionProfile, setSessionProfile] = useState<any>(null)
  const [userIdentity, setUserIdentity] = useState<any>(null)
  const [securePayload, setSecurePayload] = useState<ContactRequestPayload | null>(null)
  const [expiresIn, setExpiresIn] = useState<number>(120) // seconds until expiry
  const [isGenerating, setIsGenerating] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  // Load session profile and identity on mount
  useEffect(() => {
    Promise.all([
      getSessionProfile().then(setSessionProfile),
      resolveScendIdentity().then(setUserIdentity).catch(() => null)
    ])
  }, [])

  // Generate secure signed QR payload when dialog opens
  useEffect(() => {
    if (!open || !sessionProfile || isGenerating) return
    
    async function generateSecureQR() {
      setIsGenerating(true)
      try {
        const payload = await createContactRequest(
          sessionProfile.hederaAccountId || sessionProfile.sessionId,
          sessionProfile.handle || sessionProfile.displayName || 'Anonymous',
          sessionProfile.profileHrl || `hrl:tm/${sessionProfile.sessionId}`,
          userIdentity?.evmAddress, // Pass EVM address for XMTP
          120 // 2 minute expiry
        )
        
        setSecurePayload(payload)
        
        // Create full URL for copying/sharing
        const fullUrl = encodeToWebUrl(payload)
        setInviteCode(fullUrl)
        
        // Create short code for QR (much simpler, easier to scan)
        try {
          const shortResponse = await fetch('/api/qr/shorten', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              d: JSON.stringify(payload), 
              ttl: 300 // 5 minutes
            })
          })
          
          const { code } = await shortResponse.json()
          const shortUrl = `${window.location.origin}/c/${code}`
          
          console.log('[QR] Generated short code:', code, '→', shortUrl)
          
          // Generate QR with SHORT code (much less dense, easier to scan)
          await QRCode.toDataURL(shortUrl, { 
            errorCorrectionLevel: 'L',  // Lower EC = less dense
            margin: 4,                   // Larger quiet zone
            width: 560,                  // Big for legibility
            color: { dark: '#000000', light: '#FFFFFF' }
          }).then(setQrDataUrl)
        } catch (err) {
          console.error('[QR] Short code failed, using full URL:', err)
          // Fallback to full URL if short code fails
          await QRCode.toDataURL(fullUrl, { 
            errorCorrectionLevel: 'L',
            margin: 2,
            width: 560,
            color: { dark: '#000000', light: '#FFFFFF' }
          }).then(setQrDataUrl)
        }
        
        // Start countdown timer
        setExpiresIn(120)
      } catch (error) {
        console.error('[QR] Failed to generate secure request:', error)
        toast.error('Failed to generate QR code')
      } finally {
        setIsGenerating(false)
      }
    }
    
    generateSecureQR()
  }, [open, sessionProfile])
  
  // Countdown timer for expiry
  useEffect(() => {
    if (!open || !securePayload || expiresIn <= 0) return
    
    const interval = setInterval(() => {
      setExpiresIn(prev => {
        if (prev <= 1) {
          // QR expired, regenerate
          setSecurePayload(null)
          setQrDataUrl('')
          return 120
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [open, securePayload, expiresIn])

  // Store secure payload in signals when generated
  useEffect(() => {
    if (!securePayload || !sessionProfile) return
    
    const signalEvent = {
      id: `contact_request_${securePayload.jti}`,
      type: 'CONTACT_REQUEST' as const,
      actor: securePayload.from.acct,
      target: 'peer:unknown',
      ts: Date.now(),
      topicId: CONTACT_TOPIC || '0.0.unknown',
      metadata: securePayload,
      source: 'hcs-cached' as const
    }
    
    signalsStore.add(signalEvent)
  }, [securePayload, sessionProfile])


  async function onDecoded(raw: string) {
    try {
      let payload = null
      
      // 1. Check if it's a short code URL (e.g., https://app.com/c/ABC123)
      const shortCodeMatch = raw.match(/\/c\/([A-Za-z0-9]{6,8})$/)
      if (shortCodeMatch) {
        const code = shortCodeMatch[1]
        console.log('[QR] Resolving short code:', code)
        
        try {
          const response = await fetch(`/api/qr/resolve?c=${code}`)
          const data = await response.json()
          
          if (data.error) {
            throw new Error(`Short code ${data.error}: ${code}`)
          }
          
          payload = JSON.parse(data.d)
          console.log('[QR] Resolved payload:', payload)
        } catch (err) {
          console.error('[QR] Short code resolution failed:', err)
          throw new Error('Invalid or expired QR code')
        }
      }
      
      // 2. Try web/deeplink URL format
      if (!payload) {
        payload = decodeFromUrl(raw)
      }
      
      // 3. Fallback to direct JSON
      if (!payload && raw.trim().startsWith("{")) {
        payload = JSON.parse(raw.trim())
      }
      
      // 4. Fallback to base64-encoded JSON
      if (!payload) {
        try {
          const decoded = atob(raw.trim())
          payload = JSON.parse(decoded)
        } catch {
          // Not base64, continue
        }
      }
      
      if (!payload) {
        throw new Error('Could not decode QR code format')
      }
      
      // Verify the secure payload
      const verification = await verifyContactRequest(payload)
      
      if (!verification.valid) {
        throw new Error(verification.error || 'Invalid request')
      }
      
      // Store the validated payload
      setValidatedInvite(payload)
      
      // Log inbound request to signals store
      const signalEvent = {
        id: `contact_request_inbound_${payload.jti}`,
        type: 'CONTACT_REQUEST' as const,
        actor: payload.from.acct,
        target: sessionProfile?.hederaAccountId || sessionProfile?.sessionId || 'unknown',
        ts: Date.now(),
        topicId: CONTACT_TOPIC || '0.0.unknown',
        metadata: payload,
        source: 'hcs-cached' as const
      }
      
      signalsStore.add(signalEvent)
      toast.success("✅ Code validated!", { 
        description: `Ready to bond with ${payload.from.handle}` 
      })
    } catch (e: any) {
      setValidatedInvite(null)
      toast.error("Invalid invite", { description: e?.message ?? "Parse error" })
    }
  }

  async function acceptContact() {
    if (!validatedInvite || !sessionProfile) return
    
    try {
      // Mark JTI as used (replay prevention)
      markJtiUsed(validatedInvite.jti)
      
      // Hash the original request for verification
      const requestHash = await hashPayload(validatedInvite)
      
      const acceptorAccountId = sessionProfile.hederaAccountId || sessionProfile.sessionId
      const acceptorHandle = sessionProfile.handle || sessionProfile.displayName || 'Anonymous'
      
      // Create signed CONTACT_ACCEPT with auto-mutual flag
      const acceptPayload = await createContactAccept(
        validatedInvite,
        requestHash,
        acceptorAccountId,
        acceptorHandle,
        userIdentity?.evmAddress, // Pass EVM address for XMTP
        true // Enable auto-mutual bonding
      )
      
      // Add CONTACT_ACCEPT signal
      const acceptEvent = {
        id: `contact_accept_${acceptPayload.iat}_${Math.random().toString(36).slice(2)}`,
        type: 'CONTACT_ACCEPT' as const,
        actor: acceptorAccountId,
        target: validatedInvite.from.acct,
        ts: Date.now(),
        topicId: CONTACT_TOPIC || '0.0.unknown',
        metadata: acceptPayload,
        source: 'hcs-cached' as const
      }
      signalsStore.add(acceptEvent)
      
      // Create CONTACT_MIRROR for auto-mutual bonding
      // This represents the original requester's reciprocal acceptance
      const acceptHash = await hashPayload(acceptPayload)
      const mirrorPayload = await createContactMirror(
        requestHash,
        acceptHash,
        validatedInvite.from.acct,  // requester (will be 'from' in payload)
        acceptorAccountId,          // acceptor (will be 'to' in payload)
        validatedInvite.from.evm,   // requester's EVM address
        userIdentity?.evmAddress    // acceptor's EVM address
      )
      
      // Add CONTACT_MIRROR signal
      // Actor is the requester (who is mirroring back acceptance)
      // Target is the acceptor (who they're bonding with)
      const mirrorEvent = {
        id: `contact_mirror_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: 'CONTACT_MIRROR' as const,
        actor: validatedInvite.from.acct,
        target: acceptorAccountId,
        ts: Date.now(),
        topicId: CONTACT_TOPIC || '0.0.unknown',
        metadata: mirrorPayload,
        source: 'hcs-cached' as const
      }
      signalsStore.add(mirrorEvent)
      
      toast.success("✅ Contact bonded!", { 
        description: `Mutual connection with ${validatedInvite.from.handle} established` 
      })

      // Background HCS submit if enabled
      if (HCS_ENABLED && CONTACT_TOPIC) {
        await submitContactToHCS(acceptPayload, acceptEvent as any, acceptEvent.id)
        await submitContactToHCS(mirrorPayload, mirrorEvent as any, mirrorEvent.id)
      }

      // Emit custom event to trigger contacts refresh
      window.dispatchEvent(new CustomEvent('contactAdded', { 
        detail: { contactId: validatedInvite.from.acct, handle: validatedInvite.from.handle } 
      }))
      
      setOpen(false)
    } catch (error) {
      console.error('[QR] Failed to accept contact:', error)
      toast.error('Failed to bond contact')
    }
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
            modal-magenta-base sheen-sweep
            modal-magenta-border
            rounded-[10px] p-4
            relative
            before:absolute before:inset-0 before:rounded-[10px] before:p-[2px]
            before:bg-gradient-to-r before:from-[#FF6B35]/40 before:via-transparent before:to-[#FF6B35]/40
            before:-z-10 before:animate-pulse
          ">
            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-6 h-6 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="sr-only">Close</span>
            </button>
            {/* Modal Header */}
            <div className="mb-4 pb-3 border-b border-emerald-500/20">
              <h2 className="text-white text-xl font-bold bg-gradient-to-r from-white via-emerald-400 to-green-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-green-500/30 flex items-center justify-center border border-emerald-500/30 shadow-lg">
                  <QrCode className="w-4 h-4 text-emerald-500" />
                </div>
                QR Exchange
              </h2>
            </div>

        <Tabs defaultValue="mine" className="w-full">
          <TabsList className="grid grid-cols-2 mb-3 bg-white/5 border border-white/10">
            <TabsTrigger 
              value="mine" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-green-500/20 data-[state=active]:text-white data-[state=active]:border-emerald-500/30"
            >
              <QrCode className="w-4 h-4 mr-2" /> Share My QR
            </TabsTrigger>
            <TabsTrigger 
              value="scan"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-white data-[state=active]:border-green-500/30"
            >
              <Camera className="w-4 h-4 mr-2" /> Scan QR
            </TabsTrigger>
          </TabsList>

          {/* My QR */}
          <TabsContent value="mine" className="space-y-3">
            <div className="backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-emerald-500/20 rounded-lg p-4 flex flex-col items-center relative overflow-hidden">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 animate-pulse rounded-lg" />
              
              <div className="w-36 h-36 bg-white/95 rounded-lg flex items-center justify-center mb-3 shadow-2xl border-2 border-emerald-500/30 relative z-10">
                {qrDataUrl ? (
                  <>
                    <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain p-2 rounded-lg" />
                    {/* Subtle scanning corners */}
                    <div className="absolute inset-1 border-2 border-transparent">
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-500/60 animate-pulse" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-green-500/60 animate-pulse" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-green-500/60 animate-pulse" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-500/60 animate-pulse" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-slate-600">
                    <div className="w-5 h-5 border-2 border-emerald-500 rounded-full border-t-transparent animate-spin mb-2" />
                    <div className="text-sm font-medium">Generating QR...</div>
                  </div>
                )}
              </div>
              
              {/* Subtle glow around QR */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-lg blur-lg -z-10 animate-pulse" />
              
              {/* Expiry Timer */}
              {securePayload && (
                <div className={`flex items-center justify-center gap-2 mb-3 px-3 py-1.5 rounded-full text-xs font-medium ${
                  expiresIn > 60 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : expiresIn > 30
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                }`}>
                  <Clock className="w-3 h-3" />
                  Expires in {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, '0')}
                </div>
              )}
              
              <div className="w-full space-y-2 relative z-10">
                <Label className="text-sm font-medium text-white/80">Share Code</Label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={inviteCode} 
                    className="text-xs font-mono bg-white/5 border-white/10 text-white/70 focus:border-emerald-500/50"
                  />
                  <Button 
                    type="button" 
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-medium shadow-lg border border-emerald-500/40"
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
            {/* ZXing Camera Scanner */}
            <div className="backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-emerald-500/20 rounded-lg p-4 relative overflow-hidden w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 animate-pulse" />
              
              <div className="relative z-10 space-y-4">
                {!isScanning && (
                  <Button 
                    type="button" 
                    onClick={() => setIsScanning(true)} 
                    className="w-full bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-700 hover:from-emerald-500 hover:via-green-400 hover:to-emerald-600 text-white font-bold px-4 py-3 shadow-2xl shadow-emerald-500/40 border-2 border-emerald-400/50"
                  >
                    <Camera className="w-5 h-5 mr-2 drop-shadow-lg" /> 
                    📱 Open Camera Scanner
                  </Button>
                )}
                
                <CameraScanner
                  onScan={(raw) => {
                    console.log('[QR Scan] Decoded:', raw.substring(0, 100))
                    onDecoded(raw)
                    setIsScanning(false)
                  }}
                  isScanning={isScanning}
                  onClose={() => setIsScanning(false)}
                />
                
                {!isScanning && (
                  <div className="text-center text-xs text-white/50 space-y-1">
                    <p>• Works on all devices (iOS, Android, Desktop)</p>
                    <p>• Position QR code in frame</p>
                    <p>• Use bright lighting for best results</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Manual Input Section */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-4 space-y-4 w-full">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="w-4 h-4 text-emerald-500" />
                <Label className="text-sm font-medium text-white">Paste Contact Code</Label>
              </div>
              <Input 
                placeholder="Paste the contact's invite code here..." 
                onChange={(e) => setScanResult(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50"
              />
              <div className="flex gap-2 pt-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onDecoded(scanResult)}
                  disabled={!scanResult || !scanResult.length}
                  className="flex-1 border-white/20 text-white/80 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validatedInvite ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : null}
                  Validate Code
                </Button>
                <Button 
                  type="button" 
                  className="flex-1 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-700 hover:from-emerald-500 hover:via-green-400 hover:to-emerald-600 text-white font-bold shadow-2xl shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse border-2 border-emerald-400/60" 
                  disabled={!validatedInvite} 
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