"use client"

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, DecodeHintType } from '@zxing/library'
import { Camera, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CameraScannerProps {
  onScan: (data: string) => void
  isScanning: boolean
  onClose: () => void
}

export function CameraScanner({ onScan, isScanning, onClose }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isScanning) {
      // Stop scanning and clean up
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      codeReaderRef.current = null
      setIsReady(false)
      return
    }

    // Start scanning
    const startScanner = async () => {
      try {
        setError(null)
        
        // Create ZXing QR code reader with hints
        const hints = new Map()
        hints.set(DecodeHintType.POSSIBLE_FORMATS, ['QR_CODE'])
        hints.set(DecodeHintType.TRY_HARDER, true)
        const codeReader = new BrowserMultiFormatReader(hints)
        codeReaderRef.current = codeReader

        // Get video devices and prefer back camera
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(d => d.kind === 'videoinput')
        const backCamera = videoDevices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        ) || videoDevices[0]

        if (!backCamera) {
          throw new Error('No camera found')
        }

        // Get media stream with optimized constraints
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: backCamera.deviceId,
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        }
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        // Apply additional constraints if supported
        const track = stream.getVideoTracks()[0]
        try {
          await track.applyConstraints({
            advanced: [{ focusMode: 'continuous' }]
          })
        } catch {
          // Focus mode not supported, continue anyway
        }

        setIsReady(true)

        // Start continuous decoding
        const decode = async () => {
          if (!videoRef.current || !isScanning) return
          
          try {
            const result = await codeReader.decodeFromVideoElement(videoRef.current)
            if (result) {
              onScan(result.getText())
            }
          } catch (err) {
            // Normal when no QR code in view
          }
          
          // Continue scanning
          if (isScanning) {
            requestAnimationFrame(decode)
          }
        }
        
        decode()

      } catch (err: any) {
        console.error('[CameraScanner] Error:', err)
        setError(err.message || 'Failed to start camera')
        setIsReady(false)
      }
    }

    startScanner()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [isScanning, onScan])

  if (!isScanning) return null

  return (
    <div className="space-y-4">
      {/* Video Preview */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* Scanning Overlay */}
        {isReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64 border-2 border-[#FF6B35] rounded-lg">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#FF6B35] rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#FF6B35] rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#FF6B35] rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#FF6B35] rounded-br-lg" />
              
              {/* Scanning line animation */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#FF6B35] to-transparent animate-scan-line" />
              </div>
            </div>
          </div>
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
