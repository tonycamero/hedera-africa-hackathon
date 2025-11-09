"use client"

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, AlertCircle, Flashlight } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Global lock to prevent React Strict Mode double-initialization
let globalScannerLock = false
let globalScannerId: number = 0

interface CameraScannerProps {
  onScan: (data: string) => void
  isScanning: boolean
  onClose: () => void
}

export function CameraScanner({ onScan, isScanning, onClose }: CameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isRunningRef = useRef(false) // Track if scanner is actually running
  const isMountedRef = useRef(true) // Track component mount state
  const isStartingRef = useRef(false) // Prevent concurrent starts
  const isStoppingRef = useRef(false) // Prevent concurrent stops
  const cancelledRef = useRef(false) // Track if cleanup happened before start completed
  const camerasRef = useRef<any[] | null>(null) // Cache camera list
  const selectedCameraIdRef = useRef<string | null>(null) // Cache selected camera
  const onScanRef = useRef(onScan) // Stable reference to callback
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep onScanRef up to date
  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])
  
  useEffect(() => {
    console.log('[CameraScanner] Effect triggered', { isScanning })
    
    // Reset mounted/cancelled flags when scanning starts
    if (isScanning) {
      isMountedRef.current = true
      cancelledRef.current = false
    }
    
    if (!isScanning) {
      console.log('[CameraScanner] isScanning=false, stopping camera...', { 
        hasScanner: !!scannerRef.current, 
        isRunning: isRunningRef.current 
      })
      
      // Stop camera stream but keep scanner instance alive (singleton)
      if (scannerRef.current && isRunningRef.current && !isStoppingRef.current) {
        isStoppingRef.current = true
        console.log('[CameraScanner] Stopping camera stream...')
        const scanner = scannerRef.current
        
        scanner.stop()
          .then(() => {
            console.log('[CameraScanner] Camera stream stopped successfully')
          })
          .catch((err) => {
            console.warn('[CameraScanner] Stop warning:', err.message)
          })
          .finally(() => {
            isRunningRef.current = false
            isStoppingRef.current = false
          })
      }
      
      setIsReady(false)
      setTorchEnabled(false)
      setHasTorch(false)
      return
    }

    // Prevent double starts (React Strict Mode protection)
    if (isRunningRef.current || isStartingRef.current) {
      console.log('[CameraScanner] Already running or starting, skipping', {
        isRunning: isRunningRef.current,
        isStarting: isStartingRef.current
      })
      return
    }

    // Start camera stream
    const startScanner = async () => {
      // Guard against concurrent starts (including Strict Mode duplicates)
      if (isStartingRef.current || globalScannerLock) {
        console.log('[CameraScanner] Already starting, aborting', { local: isStartingRef.current, global: globalScannerLock })
        return
      }
      
      // Acquire global lock
      const myScannerId = ++globalScannerId
      globalScannerLock = true
      isStartingRef.current = true
      cancelledRef.current = false
      
      console.log('[CameraScanner] Acquired lock', { scannerId: myScannerId })
      
      try {
        console.log('[CameraScanner] Starting camera stream...')
        setError(null)
        
        // Wait a bit to ensure any previous stop() has completed
        await new Promise(resolve => setTimeout(resolve, 150))
        
        // Ensure DOM element exists
        const element = document.getElementById('qr-reader')
        if (!element) {
          console.error('[CameraScanner] DOM element #qr-reader not found')
          throw new Error('Scanner element not ready')
        }
        
        // Initialize scanner instance once (singleton pattern)
        if (!scannerRef.current) {
          console.log('[CameraScanner] Creating singleton scanner instance')
          scannerRef.current = new Html5Qrcode('qr-reader')
        }
        
        const scanner = scannerRef.current

        // Fetch/cache cameras once
        if (!camerasRef.current) {
          console.log('[CameraScanner] Fetching available cameras...')
          const devices = await Html5Qrcode.getCameras()
          if (!devices || devices.length === 0) {
            throw new Error('No camera found')
          }
          camerasRef.current = devices
          console.log('[CameraScanner] Found cameras:', devices.length)
        }

        // Select and cache preferred camera
        if (!selectedCameraIdRef.current) {
          const backCamera = camerasRef.current.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          ) || camerasRef.current[0]
          selectedCameraIdRef.current = backCamera.id
          console.log('[CameraScanner] Selected camera:', backCamera.label)
        }

        // Configure scanning with all supported formats
        const config = {
          fps: 30, // Higher frame rate for better detection
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            // Larger scan box - 70% of smaller dimension
            const minDimension = Math.min(viewfinderWidth, viewfinderHeight)
            const boxSize = Math.floor(minDimension * 0.7)
            return { width: boxSize, height: boxSize }
          },
          aspectRatio: 1.0,
          formatsToSupport: [
            0, // QR_CODE
            1, // DATA_MATRIX
            2  // AZTEC
          ],
          videoConstraints: {
            facingMode: 'environment',
            advanced: [{ torch: false }] as any[]
          },
          verbose: true // Enable verbose logging
        }

        // Start camera stream with cached camera ID
        console.log('[CameraScanner] Starting camera stream with ID:', selectedCameraIdRef.current)
        
        try {
          await scanner.start(
            selectedCameraIdRef.current,
            config,
            (decodedText) => {
              console.log('[CameraScanner] ✅ QR code detected:', decodedText)
              onScanRef.current(decodedText)
            },
            (errorMessage) => {
              // Log all errors to diagnose issues
              if (errorMessage && !errorMessage.includes('NotFoundException')) {
                console.warn('[CameraScanner] Scan error:', errorMessage)
              }
              // Log occasionally to verify scanner is running
              if (Math.random() < 0.01) { // 1% of frames
                console.log('[CameraScanner] 🔍 Scanning...')
              }
            }
          )
        } catch (startErr: any) {
          // Catch transition errors specifically
          if (startErr.message?.includes('transition')) {
            console.warn('[CameraScanner] Scanner in transition, retrying in 300ms...')
            await new Promise(resolve => setTimeout(resolve, 300))
            
            // Retry once
            await scanner.start(
              selectedCameraIdRef.current,
              config,
              (decodedText) => {
                console.log('[CameraScanner] QR code detected:', decodedText)
                onScanRef.current(decodedText)
              },
              () => {}
            )
          } else {
            throw startErr
          }
        }

        console.log('[CameraScanner] Camera stream started successfully')
        
        // Only update state if still mounted AND not cancelled
        if (isMountedRef.current && !cancelledRef.current) {
          isRunningRef.current = true
          setIsReady(true)
        } else if (cancelledRef.current) {
          // Unmounted before start finished - stop immediately
          console.log('[CameraScanner] Start completed but component unmounted - stopping now')
          scanner.stop()
            .catch((err) => console.warn('[CameraScanner] Post-cancel stop warning:', err.message))
            .finally(() => {
              isRunningRef.current = false
            })
        }

        // Check if torch is available (only if still mounted)
        if (isMountedRef.current) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            const track = stream.getVideoTracks()[0]
            const capabilities = track.getCapabilities() as any
            if (capabilities.torch && isMountedRef.current) {
              setHasTorch(true)
            }
            stream.getTracks().forEach(t => t.stop())
          } catch {
            // Torch not available
          }
        }

      } catch (err: any) {
        console.error('[CameraScanner] Error:', err)
        
        // Only update state if still mounted
        if (isMountedRef.current) {
          setError(err.message || 'Failed to start camera')
          setIsReady(false)
        }
        
        isRunningRef.current = false
      } finally {
        // Always reset starting flag and release global lock
        isStartingRef.current = false
        globalScannerLock = false
        console.log('[CameraScanner] Released lock', { scannerId: myScannerId })
      }
    }

    // Small delay to ensure DOM is fully mounted
    const timeout = setTimeout(() => {
      startScanner()
    }, 100)

    return () => {
      console.log('[CameraScanner] Cleanup function called', {
        hasScanner: !!scannerRef.current,
        isRunning: isRunningRef.current,
        isStarting: isStartingRef.current
      })
      
      // Mark as unmounted and cancelled to prevent state updates
      isMountedRef.current = false
      cancelledRef.current = true // Signal to startScanner that we've unmounted
      isStartingRef.current = false // Reset starting flag
      
      clearTimeout(timeout)
      
      // Delay cleanup slightly to let any transitions complete
      const cleanupTimer = setTimeout(() => {
        // Stop camera stream if running (but keep scanner instance)
        if (scannerRef.current && isRunningRef.current && !isStoppingRef.current) {
          isStoppingRef.current = true
          const scanner = scannerRef.current
          
          console.log('[CameraScanner] Cleanup: stopping camera stream')
          scanner.stop()
            .catch((err) => {
              console.warn('[CameraScanner] Cleanup stop warning:', err.message)
            })
            .finally(() => {
              isRunningRef.current = false
              isStoppingRef.current = false
            })
        }
      }, 100) // 100ms delay for transitions to settle
      
      // Return nested cleanup for the timer
      return () => clearTimeout(cleanupTimer)
    }
  }, [isScanning]) // Removed onScan - using ref instead

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
