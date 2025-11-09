// components/SendSignalModal.tsx
// DEPRECATED: Simple "Send Props" flow is no longer used.
// All recognition flows now use MintSignalFlow (NFT-based with optional inscription).
// This component is kept for backward compatibility but returns null.

'use client'

interface SendSignalModalProps {
  isOpen: boolean
  onClose: () => void
  recipient?: {
    accountId: string
    knsName?: string | null
    publicKey: string
  }
}

export function SendSignalModal({ isOpen, onClose, recipient }: SendSignalModalProps) {
  // DEPRECATED: No longer used; kept to avoid import errors.
  return null
}

export default SendSignalModal
