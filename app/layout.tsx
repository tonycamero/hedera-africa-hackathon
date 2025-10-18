import type React from "react"
import type { Metadata, Viewport } from "next"
import { Playfair_Display, Source_Sans_3 } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import BootHCSClient from "@/app/providers/BootHCSClient"
import { BootRegistryClient } from "@/lib/registry/BootRegistryClient"
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
  
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable} ${themeClass}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased" data-genz={isGenZ() ? 'true' : 'false'}>
        <BootRegistryClient />
        <BootHCSClient />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
