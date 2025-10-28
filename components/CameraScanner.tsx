"use client"

import { useEffect, useRef, useState } from 'react'
import { BrowserQRCodeReader } from '@zxing/browser'
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
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null)
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    if (!isScanning) {
      // Stop scanning
      if (controlsRef.current) {
        controlsRef.current.stop()
        controlsRef.current = null
      }
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
      }
      setIsReady(false)
      return
    }

    // Start scanning
    const startScanner = async () => {
      try {
        setError(null)
        
        // Create ZXing QR code reader
        const codeReader = new BrowserQRCodeReader()
        codeReaderRef.current = codeReader

        // Get video devices and prefer back camera
        const devices = await codeReader.listVideoInputDevices()
        const backCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear')
        ) || devices[0]

        if (!backCamera) {
          throw new Error('No camera found')
        }

        // Start continuous scanning with optimized constraints
        const controls = await codeReader.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current!,
          (result, error) => {
            if (result) {
              onScan(result.getText())
              // Keep scanning for more QR codes
            }
            // Ignore errors during scanning (normal when no QR in view)
          }
        )

        controlsRef.current = controls
        setIsReady(true)

        // Apply optimized video constraints for better scanning
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream
          const track = stream.getVideoTracks()[0]
          
          await track.applyConstraints({
            advanced: [
              {
                focusMode: 'continuous',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            ]
          }).catch(() => {
            // Constraints not supported, continue anyway
          })
        }

      } catch (err: any) {
        console.error('[CameraScanner] Error:', err)
        setError(err.message || 'Failed to start camera')
        setIsReady(false)
      }
    }

    startScanner()

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop()
      }
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
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
