import type React from "react"
import type { Metadata, Viewport } from "next"
import { Playfair_Display, Source_Sans_3 } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import BootHCSClient from "@/app/providers/BootHCSClient"
import { BootRegistryClient } from "@/lib/registry/BootRegistryClient"
import { LensProvider } from "@/components/providers/LensProvider"
import { IdentityProvider } from "@/app/providers/IdentityProvider"
import { isGenZ } from "@/lib/ui/theme"
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
  title: "TrustMesh - Build Your Circle",
  description: "GenZ Lens - Real connections, real trust. Send props, discover IRL events, build your crew with Trust Agent.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

// Force dynamic rendering for all pages to prevent prerendering errors
export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const themeClass = isGenZ() ? 'theme-genz-dark' : 'theme-mesh-dark'
  
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable} ${themeClass}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased" data-genz={isGenZ() ? 'true' : 'false'}>
        <LensProvider />
        <BootRegistryClient />
        <BootHCSClient />
        <IdentityProvider>
          {children}
        </IdentityProvider>
        <Toaster />
      </body>
    </html>
  )
}
