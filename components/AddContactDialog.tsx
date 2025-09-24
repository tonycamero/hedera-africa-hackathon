"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import QRCode from "qrcode"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { shouldPublishToHCS } from "@/lib/demo/seed"

// ---- ENV & flags ----
const HCS_ENABLED = (process.env.NEXT_PUBLIC_HCS_ENABLED ?? "false") === "true"
const CONTACT_TOPIC = process.env.NEXT_PUBLIC_TOPIC_CONTACT || ""

// Background submit helper with HCS protection for seed data
async function submitContactToHCS(envelope: any, signalEvent: SignalEvent, signalId?: string) {
  if (!HCS_ENABLED || !CONTACT_TOPIC) return
  if (!shouldPublishToHCS(signalEvent)) {
    console.log('[Contact] Skipping HCS submit for seeded data')
    return
  }
  
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

export function AddContactDialog({ handle }: { handle?: string }) {
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
          <QrCode className="w-4 h-4 mr-2" /> Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contact (QR)</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="mine" className="w-full">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="mine"><QrCode className="w-3 h-3 mr-1" /> My QR</TabsTrigger>
            <TabsTrigger value="scan"><Camera className="w-3 h-3 mr-1" /> Scan</TabsTrigger>
          </TabsList>

          {/* My QR */}
          <TabsContent value="mine" className="space-y-3">
            <div className="rounded-lg border p-3 flex flex-col items-center">
              <div className="w-48 h-48 bg-white rounded-md flex items-center justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-sm text-slate-500">Generating QR...</div>
                )}
              </div>
              <div className="w-full">
                <Label className="text-xs text-slate-500">Invite code</Label>
                <div className="flex gap-2">
                  <Input readOnly value={inviteCode} className="text-xs" />
                  <Button type="button" variant="outline" onClick={() => { navigator.clipboard.writeText(inviteCode); toast.success("Copied"); }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {!CONTACT_TOPIC && (
                <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> HCS disabled (local demo). Set NEXT_PUBLIC_TOPIC_CONTACT to submit on-chain.
                </p>
              )}
            </div>
          </TabsContent>

          {/* Scan */}
          <TabsContent value="scan" className="space-y-3">
            {detectorSupported ? (
              <>
                <video ref={videoRef} playsInline muted className="w-full rounded-md bg-black/5 aspect-video" />
                <div className="flex gap-2">
                  <Button type="button" onClick={startCamera} className="bg-slate-900 hover:bg-slate-800">
                    <Camera className="w-4 h-4 mr-2" /> {cameraReady ? "Scanning…" : "Start camera"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500">Camera scanning not supported on this device. Paste the code instead.</p>
            )}
            <div className="space-y-2">
              <Label className="text-xs">Or paste invite code</Label>
              <Input placeholder="Paste base64 invite…" onChange={(e) => setScanResult(e.target.value)} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onDecoded(scanResult)}>Validate</Button>
                <Button type="button" className="bg-green-600 hover:bg-green-700 text-white" disabled={!scanResult || !scanResult.length} onClick={acceptContact}>
                  <Check className="w-4 h-4 mr-1" /> Accept
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}