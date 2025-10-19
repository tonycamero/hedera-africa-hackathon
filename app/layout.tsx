import type React from "react"
import type { Metadata, Viewport } from "next"
import { Playfair_Display, Source_Sans_3 } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { shouldDisableLegacyHCS } from "@/lib/featureFlags"
import { isGenZ } from "@/lib/ui/theme"
import "./globals.css"
import "../styles/fairfield-voice.css"

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
  const themeClass = isGenZ() ? 'theme-genz-dark' : 'theme-mesh-dark'
  
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
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable}`} suppressHydrationWarning>
      <body className="min-h-screen" style={{background: '#ffffff', color: '#000000'}} data-genz={isGenZ() ? 'true' : 'false'}>
        {LegacyProviders}
        {children}
        <Toaster />
      </body>
    </html>
  )
}
