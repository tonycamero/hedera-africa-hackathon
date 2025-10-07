import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Source_Sans_3 } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import BootHCSClient from "@/app/providers/BootHCSClient"
import { BootRegistryClient } from "@/lib/registry/BootRegistryClient"
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
  title: "TrustMesh - Community Builder Edition",
  description: "Analytics-driven trust network platform for community builders and organizations",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable} theme-mesh-dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <BootRegistryClient />
        <BootHCSClient />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
