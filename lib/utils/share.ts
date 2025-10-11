// lib/utils/share.ts
// T7 - Share flow utilities for GenZ boost viral sharing

import { createBoostUrl } from '@/lib/ids/boostId'

export interface ShareData {
  title: string
  text: string
  url: string
}

/**
 * Generate GenZ-friendly share text for boost signals
 */
export function createShareText(templateText?: string, recipientHandle?: string): string {
  const baseText = "Co-sign this signal"
  
  if (recipientHandle) {
    return `${baseText} for @${recipientHandle} — tap ⚡ Boost (anon) or Suggest 🔁`
  }
  
  return `${baseText} — tap ⚡ Boost (anon) or Suggest 🔁`
}

/**
 * Create share data for a boost signal
 */
export function createBoostShareData(boostId: string, options?: {
  templateText?: string
  recipientHandle?: string
  baseUrl?: string
  utm?: boolean
}): ShareData {
  const baseUrl = options?.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  let url = createBoostUrl(boostId, baseUrl)
  
  // Add UTM parameters if requested
  if (options?.utm) {
    const params = new URLSearchParams({
      s: 'share',
      utm_source: 'boost_share',
      utm_medium: 'social',
      utm_campaign: 'genz_viral'
    })
    url += `?${params.toString()}`
  }
  
  return {
    title: '🔥 GenZ Signal Boost',
    text: createShareText(options?.templateText, options?.recipientHandle),
    url
  }
}

/**
 * Native share with fallback to clipboard
 */
export async function shareBoost(shareData: ShareData): Promise<boolean> {
  // Try native Web Share API first (mobile browsers)
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData)
      return true
    } catch (error) {
      // User cancelled or share failed
      if (error instanceof Error && error.name === 'AbortError') {
        return false // User cancelled
      }
      // Fall through to clipboard
    }
  }
  
  // Fallback to clipboard copy
  return copyToClipboard(shareData.url)
}

/**
 * Copy boost URL to clipboard with user feedback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    
    // Show user feedback
    if (typeof window !== 'undefined') {
      // Simple toast-like feedback
      const feedback = document.createElement('div')
      feedback.textContent = '🔗 Link copied to clipboard!'
      feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 255, 127, 0.9);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10000;
        animation: fadeInOut 3s ease-in-out forwards;
      `
      
      // Add fade animation
      const style = document.createElement('style')
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          20%, 80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `
      document.head.appendChild(style)
      
      document.body.appendChild(feedback)
      setTimeout(() => {
        document.body.removeChild(feedback)
        document.head.removeChild(style)
      }, 3000)
    }
    
    return true
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (success && typeof window !== 'undefined') {
        alert('🔗 Link copied to clipboard!')
      }
      
      return success
    } catch (err) {
      document.body.removeChild(textArea)
      
      // Last resort: show the URL to user
      if (typeof window !== 'undefined') {
        const userCopy = prompt('Copy this link to share:', text)
        return userCopy !== null
      }
      
      return false
    }
  }
}

/**
 * Share to specific social media platforms
 */
export const socialShare = {
  twitter: (shareData: ShareData) => {
    const params = new URLSearchParams({
      url: shareData.url,
      text: shareData.text
    })
    return `https://twitter.com/intent/tweet?${params.toString()}`
  },
  
  linkedin: (shareData: ShareData) => {
    const params = new URLSearchParams({
      url: shareData.url
    })
    return `https://linkedin.com/sharing/share-offsite/?${params.toString()}`
  },
  
  facebook: (shareData: ShareData) => {
    const params = new URLSearchParams({
      u: shareData.url
    })
    return `https://facebook.com/sharer/sharer.php?${params.toString()}`
  }
}

export default {
  createShareText,
  createBoostShareData,
  shareBoost,
  copyToClipboard,
  socialShare
}