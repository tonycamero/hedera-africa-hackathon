/**
 * Share Utilities with UTM tracking and campus codes
 * 
 * Handles viral sharing with proper attribution and analytics
 */

export interface ShareOptions {
  boostId: string
  templateText?: string
  fill?: string
  recipient?: string
  realm?: string
  source?: 'ig' | 'tiktok' | 'twitter' | 'copy' | 'native'
  campaign?: string
}

/**
 * Build shareable URL with UTM parameters
 */
export function buildShareUrl(options: ShareOptions): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_BASE_URL || 'https://trustmesh.vercel.app'
  
  const url = new URL(`/boost/${options.boostId}`, baseUrl)
  
  // Add UTM parameters for tracking
  if (options.source) {
    url.searchParams.set('utm_source', options.source)
  }
  
  if (options.campaign) {
    url.searchParams.set('utm_campaign', options.campaign)
  } else {
    // Default campaign based on context
    const defaultCampaign = options.realm ? `campus_${options.realm}` : 'genz_viral'
    url.searchParams.set('utm_campaign', defaultCampaign)
  }
  
  url.searchParams.set('utm_medium', 'social')
  
  // Add realm for campus segmentation
  if (options.realm) {
    url.searchParams.set('realm', options.realm)
  }
  
  return url.toString()
}

/**
 * Generate share text with proper formatting
 */
export function buildShareText(options: ShareOptions): string {
  const templates = [
    `I just sent a Signal on TrustMesh — boost it? ⚡`,
    `Check out this recognition on TrustMesh — boost it if you agree! ⚡`,
    `Someone got called out on TrustMesh — boost to support! ⚡`,
    `Real props on the blockchain — boost this signal! ⚡`,
  ]
  
  // Use template text if available for more context
  if (options.templateText && options.fill && options.recipient) {
    const cleanTemplate = options.templateText.replace('___', `"${options.fill}"`)
    const recipientText = options.recipient.startsWith('@') ? options.recipient : `@${options.recipient}`
    return `🔥 "${cleanTemplate}" for ${recipientText} — boost it? ⚡`
  }
  
  // Otherwise use random generic template
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
  return randomTemplate
}

/**
 * Share via native Web Share API or fallback to clipboard
 */
export async function shareSignal(options: ShareOptions): Promise<{ success: boolean; method: string }> {
  const shareUrl = buildShareUrl(options)
  const shareText = buildShareText(options)
  
  // Try native share first
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'TrustMesh Signal',
        text: shareText,
        url: shareUrl
      })
      return { success: true, method: 'native' }
    } catch (error) {
      // User cancelled or share failed, fall back to clipboard
    }
  }
  
  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
    return { success: true, method: 'clipboard' }
  } catch (error) {
    // Final fallback - just return the text for manual copy
    console.error('Share failed:', error)
    return { success: false, method: 'manual' }
  }
}

/**
 * Generate campus-specific share text
 */
export function buildCampusShareText(options: ShareOptions & { campus?: string }): string {
  const campusName = options.campus || options.realm
  
  if (campusName) {
    return `🎓 ${campusName} recognition on TrustMesh — boost to support your peer! ⚡`
  }
  
  return buildShareText(options)
}

/**
 * Track share events (integrates with telemetry)
 */
export function trackShareEvent(options: ShareOptions & { method: string }) {
  // This would integrate with your analytics
  const event = {
    type: 'signal_shared',
    boostId: options.boostId,
    source: options.source,
    campaign: options.campaign,
    method: options.method,
    realm: options.realm,
    timestamp: Date.now()
  }
  
  console.log('[ShareUtils] Share event:', event)
  
  // Send to analytics if configured
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'share', {
      event_category: 'engagement',
      event_label: options.boostId,
      method: options.method,
      source: options.source
    })
  }
}