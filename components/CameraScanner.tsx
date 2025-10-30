"use client"

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, AlertCircle, Flashlight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CameraScannerProps {
  onScan: (data: string) => void
  isScanning: boolean
  onClose: () => void
}

export function CameraScanner({ onScan, isScanning, onClose }: CameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isScanning) {
      // Stop scanning and clean up
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current.clear()
        scannerRef.current = null
      }
      setIsReady(false)
      setTorchEnabled(false)
      setHasTorch(false)
      return
    }

    // Prevent double initialization
    if (scannerRef.current) return

    // Start scanning
    const startScanner = async () => {
      try {
        setError(null)
        
        // Create html5-qrcode instance
        const scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner

        // Get cameras and prefer back camera
        const devices = await Html5Qrcode.getCameras()
        if (!devices || devices.length === 0) {
          throw new Error('No camera found')
        }

        const backCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        ) || devices[0]

        // Configure scanning
        const config = {
          fps: 10, // Battery-efficient frame rate
          qrbox: { width: 250, height: 250 }, // Scan region
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: 'environment',
            advanced: [{ torch: false }] as any[]
          }
        }

        // Start scanning
        await scanner.start(
          backCamera.id,
          config,
          (decodedText) => {
            onScan(decodedText)
          },
          () => {
            // Ignore scan errors (normal when no QR in view)
          }
        )

        setIsReady(true)

        // Check if torch is available
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          const track = stream.getVideoTracks()[0]
          const capabilities = track.getCapabilities() as any
          if (capabilities.torch) {
            setHasTorch(true)
          }
          stream.getTracks().forEach(t => t.stop())
        } catch {
          // Torch not available
        }

      } catch (err: any) {
        console.error('[CameraScanner] Error:', err)
        setError(err.message || 'Failed to start camera')
        setIsReady(false)
      }
    }

    startScanner()

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current.clear()
      }
    }
  }, [isScanning, onScan])

  // Torch toggle handler
  const toggleTorch = async () => {
    if (!scannerRef.current) return
    
    try {
      const newState = !torchEnabled
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newState }] as any[]
      })
      setTorchEnabled(newState)
    } catch (err) {
      console.error('[CameraScanner] Torch toggle failed:', err)
    }
  }

  if (!isScanning) return null

  return (
    <div className="space-y-4">
      {/* Video Preview */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
        {/* html5-qrcode container */}
        <div 
          id="qr-reader" 
          ref={containerRef}
          className="w-full h-full"
        />
        
        {/* Torch/Flashlight Button */}
        {isReady && hasTorch && (
          <button
            onClick={toggleTorch}
            className="absolute top-4 right-4 p-3 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
            aria-label="Toggle flashlight"
          >
            <Flashlight 
              className={`w-6 h-6 ${torchEnabled ? 'text-yellow-400' : 'text-white'}`}
            />
          </button>
        )}

        {/* Loading State */}
        {!isReady && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
            <Camera className="w-12 h-12 mb-3 animate-pulse" />
            <p className="text-sm">Starting camera...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
            <AlertCircle className="w-12 h-12 mb-3 text-red-400" />
            <p className="text-sm text-center mb-3">{error}</p>
            <Button
              onClick={onClose}
              variant="outline"
              className="text-white border-white/30"
            >
              Close
            </Button>
          </div>
        )}
      </div>

      {/* Instructions */}
      {isReady && (
        <div className="text-center text-xs text-white/60 space-y-1">
          <p>• Position QR code within the frame</p>
          <p>• Hold 6-10 inches from screen</p>
          <p>• Max brightness, avoid glare</p>
        </div>
      )}

      {/* Scanning animation CSS */}
      <style jsx>{`
        @keyframes scan-line {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(300%);
          }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
      `}</style>
    </div>
  )
}
