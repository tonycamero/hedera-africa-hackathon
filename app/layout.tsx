import type React from "react"
import type { Metadata, Viewport } from "next"
import { Playfair_Display, Source_Sans_3 } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { shouldDisableLegacyHCS, isFairfieldVoice } from "@/lib/featureFlags"
import { isGenZ } from "@/lib/ui/theme"
import PersonaNav from "@/components/navigation/PersonaNav"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["400", "700"],
})

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "Fairfield Voice - Make Your Voice Heard",
  description: "Local government engagement platform powered by TrustMesh. Join your Inner Circle, support initiatives, and make a difference in your community.",
  generator: "v0.app",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Dynamic theme selection based on mode
  const getThemeClass = () => {
    const fairfieldMode = isFairfieldVoice()
    const genzMode = isGenZ()
    
    // Debug logging
    console.log('[Layout] Theme detection:', {
      fairfieldMode,
      genzMode,
      envVar: process.env.NEXT_PUBLIC_APP_MODE,
      resultTheme: fairfieldMode ? 'theme-fairfield-voice' : genzMode ? 'theme-genz-dark' : 'theme-mesh-dark'
    })
    
    if (fairfieldMode) return 'theme-fairfield-voice'
    if (genzMode) return 'theme-genz-dark' 
    return 'theme-mesh-dark'
  }
  
  const themeClass = getThemeClass()
  
  // Dynamic import of legacy TrustMesh components only when not in Fairfield mode
  const LegacyProviders = shouldDisableLegacyHCS() ? null : (() => {
    const BootHCSClient = require('@/app/providers/BootHCSClient').default
    const { BootRegistryClient } = require('@/lib/registry/BootRegistryClient')
    return (
      <>
        <BootRegistryClient />
        <BootHCSClient />
      </>
    )
  })()
  
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable} ${themeClass}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased" data-genz={isGenZ() ? 'true' : 'false'}>
        {LegacyProviders}
        <div className="p-4 border-b"><PersonaNav/></div>
        <main className="p-4">{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
