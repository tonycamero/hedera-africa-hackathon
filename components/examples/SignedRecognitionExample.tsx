/**
 * Example: Client-Side Signed Recognition Minting
 * 
 * This component demonstrates how to sign recognition payloads
 * on the client before submitting to the API.
 * 
 * Usage: Integrate this pattern into your recognition creation UI
 */

'use client'

import { useState } from 'react'
import { signRecognition } from '@/lib/hedera/signRecognition'
import { getTRSTCost, formatTRST } from '@/lib/config/pricing'
import { toast } from 'sonner'

interface RecognitionFormData {
  recipientId: string
  recipientName: string
  message: string
  category: 'social' | 'academic' | 'professional'
  trustAmount: number
}

export function SignedRecognitionExample() {
  const [formData, setFormData] = useState<RecognitionFormData>({
    recipientId: '',
    recipientName: '',
    message: '',
    category: 'professional',
    trustAmount: 5
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleMintRecognition = async () => {
    setIsSubmitting(true)

    try {
      // 1. Get current user's account ID and private key
      // TODO: In production, get from authenticated session/Magic.link
      const currentUserId = '0.0.123456' // Replace with actual user ID
      const privateKey = process.env.NEXT_PUBLIC_HEDERA_OPERATOR_KEY || ''

      if (!privateKey) {
        throw new Error('Private key not available. Please log in.')
      }

      // 2. Sign the recognition payload with user's key
      console.log('[Recognition] Signing payload...')
      const signedPayload = await signRecognition(
        {
          fromAccountId: currentUserId,
          toAccountId: formData.recipientId,
          message: formData.message,
          trustAmount: formData.trustAmount,
          metadata: {
            category: formData.category,
            tags: ['user-generated']
          }
        },
        privateKey
      )

      console.log('[Recognition] Payload signed successfully')
      console.log('[Recognition] Signature:', signedPayload.signature.slice(0, 16) + '...')

      // 3. Show cost to user
      const trstCost = getTRSTCost('RECOGNITION_MINT')
      toast.info(`Cost: ${formatTRST(trstCost)}`, {
        description: 'Platform subsidizes Hedera gas fees'
      })

      // 4. Submit signed payload to API
      const response = await fetch('/api/hcs/mint-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Signed payload fields
          ...signedPayload,
          
          // Additional recognition metadata
          tokenId: `rec_${Date.now()}`,
          name: `${formData.category} Recognition`,
          category: formData.category,
          subtitle: formData.message.slice(0, 50),
          emoji: formData.category === 'professional' ? '⭐' : '🔥',
          issuerId: currentUserId,
          recipientId: formData.recipientId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 402) {
          throw new Error(`Insufficient TRST balance: ${result.error}`)
        }
        throw new Error(result.error || 'Failed to mint recognition')
      }

      // 5. Success!
      console.log('[Recognition] Minted successfully:', result)
      console.log('[Recognition] TRST charged:', result.trstCharged)
      console.log('[Recognition] New balance:', result.trstBalance)

      toast.success('Recognition minted! 🎉', {
        description: `Sent to ${formData.recipientName}. Cost: ${formatTRST(result.trstCharged)}`
      })

      // Reset form
      setFormData({
        recipientId: '',
        recipientName: '',
        message: '',
        category: 'professional',
        trustAmount: 5
      })

    } catch (error: any) {
      console.error('[Recognition] Minting failed:', error)
      toast.error('Failed to mint recognition', {
        description: error.message || 'Please try again'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold">Send Recognition (Signed)</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Recipient Name</label>
          <input
            type="text"
            value={formData.recipientName}
            onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
            placeholder="Alice"
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Recipient Account ID</label>
          <input
            type="text"
            value={formData.recipientId}
            onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
            placeholder="0.0.123456"
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Great work on the project!"
            className="w-full px-3 py-2 border rounded min-h-[80px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="professional">Professional</option>
            <option value="social">Social</option>
            <option value="academic">Academic</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Trust Allocation</label>
          <input
            type="number"
            value={formData.trustAmount}
            onChange={(e) => setFormData({ ...formData, trustAmount: parseInt(e.target.value) })}
            min={0}
            max={100}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>

      <div className="pt-2 border-t">
        <div className="text-sm text-gray-600 mb-3">
          <strong>Cost:</strong> {formatTRST(getTRSTCost('RECOGNITION_MINT'))}
          <br />
          <span className="text-xs">Platform pays Hedera gas (~$0.0001)</span>
        </div>

        <button
          onClick={handleMintRecognition}
          disabled={isSubmitting || !formData.recipientId || !formData.message}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Signing & Minting...' : 'Sign & Mint Recognition'}
        </button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>✅ Your signature proves you authorized this recognition</p>
        <p>✅ Platform pays Hedera gas, you pay ${getTRSTCost('RECOGNITION_MINT')} TRST</p>
        <p>✅ Non-custodial: Your key never leaves your device</p>
      </div>
    </div>
  )
}
