'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, LogOut, Settings, User as UserIcon, ExternalLink } from 'lucide-react'
import { magic } from '@/lib/magic'
import { hashScanAccountUrl } from '@/lib/util/hashscan'
import { toast } from 'sonner'
import { normalizeProfile, getProfileDisplayText } from '@/lib/client/normalizeProfile'

export function HeaderMenu() {
  const router = useRouter()
  const pathname = usePathname()
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        // Get the currently logged-in Magic user
        const isLoggedIn = await magic?.user.isLoggedIn()
        if (!isLoggedIn) return
        
        const metadata = await magic?.user.getInfo()
        const email = metadata?.email
        if (!email) return
        
        // Get profile from API (uses normalizer with caching)
        const token = await magic?.user.getIdToken()
        if (!token) return
        
        const res = await fetch('/api/profile/status', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (res.ok) {
          const data = await res.json()
          const profile = normalizeProfile(data)
          
          if (profile) {
            setAccountId(profile.accountId)
            const displayText = getProfileDisplayText(profile)
            // If profile has no name/handle and returns "Unnamed", fall back to email
            setDisplayName(displayText === 'Unnamed' ? email : displayText)
          } else {
            // Fallback to email if no profile yet
            setDisplayName(email)
          }
        } else {
          setDisplayName(email)
        }
      } catch (error) {
        console.error('[HeaderMenu] Failed to load profile:', error)
      }
    }
    
    loadCurrentUser()
  }, [])

  const doLogout = async () => {
    try {
      await magic?.user.logout()
      localStorage.removeItem('tm:users')
      localStorage.removeItem('MAGIC_TOKEN')
      localStorage.removeItem('MAGIC_DID')
      toast.success('Logged out successfully')
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
    }
  }

  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'

  return (
    <div className="sticky top-0 z-50 bg-black/20 backdrop-blur-md supports-[backdrop-filter]:bg-black/10 border-b border-white/10">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: TrustMesh logo and branding */}
        <div className="flex items-center gap-2">
          {/* TrustMesh Logo */}
          <div className="w-9 h-9 flex items-center justify-center opacity-90">
            <svg 
              width="24" 
              height="24"
              viewBox="0 0 24 24" 
              fill="none"
              className="animate-spin-slow-ccw"
            >
              <circle cx="6" cy="18" r="2" stroke="#FF6B35" strokeWidth="2" fill="none"/>
              <circle cx="18" cy="18" r="2" stroke="#FF6B35" strokeWidth="2" fill="none"/>
              <circle cx="12" cy="6" r="2" stroke="#FF6B35" strokeWidth="2" fill="none"/>
              <path d="M6 18L12 6L18 18" stroke="#FF6B35" strokeWidth="2" opacity="0.6"/>
              <path d="M6 18L18 18" stroke="#FF6B35" strokeWidth="2" opacity="0.6"/>
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-xl text-white tracking-tight">TrustMesh</h1>
            <p className="text-xs text-white/50 font-light">
              Own Your Network
            </p>
          </div>
        </div>

        {/* Right: avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 hover:bg-white/10 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF6B35]/30 to-white/10 border border-[#FF6B35]/30 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-[#FF6B35]" />
            </div>
            <span className="text-xs text-white/80">{displayName ?? 'Account'}</span>
            <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <>
              {/* Click outside to close */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setOpen(false)}
              />
              <div
                className="absolute right-0 mt-2 w-56 bg-black/90 backdrop-blur-md border border-white/10 rounded-md shadow-lg p-2 z-50"
              >
                <Link
                  href="/me"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded px-3 py-2 transition-colors"
                >
                  <UserIcon className="w-4 h-4" /> Profile & Balances
                </Link>
                {accountId && (
                  <a
                    href={hashScanAccountUrl(accountId, network)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded px-3 py-2 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> View on HashScan
                  </a>
                )}
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded px-3 py-2 transition-colors"
                >
                  <Settings className="w-4 h-4" /> Settings
                </Link>
                <div className="h-px bg-white/10 my-2" />
                <button
                  onClick={doLogout}
                  className="w-full flex items-center gap-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded px-3 py-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
