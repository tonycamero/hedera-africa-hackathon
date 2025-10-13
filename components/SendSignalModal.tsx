// components/SendSignalModal.tsx
// TODO: T2 - Send Signal Modal with GenZ templates

'use client'

import React, { useState } from 'react'
import { Modal } from './Modal'
import { guardContent } from '../lib/filters/contentGuard'
import { genzSignalService } from '../lib/services/GenzSignalService'
import { SignalTemplateService } from '../lib/templates/SignalTemplateService'
import { TemplateManager } from '../lib/templates/TemplateManager'
import { SignalTemplate } from '../lib/templates/types'
import { TemplateTelemetry } from '../lib/telemetry/TemplateTelemetry'

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
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [fillText, setFillText] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // Get templates for GenZ lens
  const templates = SignalTemplateService.getTemplatesForLens('genz')

  // Reset form when modal closes
  const handleClose = () => {
    setSelectedTemplate('')
    setFillText('')
    setNote('')
    setError('')
    setSuccess(false)
    onClose()
  }

  // Handle signal submission
  const handleSubmit = async () => {
    if (!recipient || !selectedTemplate || !fillText.trim()) {
      setError('Please select a template and fill in the blank')
      return
    }

    // Get selected template object for validation
    const templateObj = templates.find(t => t.id === selectedTemplate)
    if (!templateObj) {
      setError('Invalid template selected')
      return
    }
    
    // Validate content length and positivity
    if (fillText.length > templateObj.maxFill) {
      setError(`Fill text too long (max ${templateObj.maxFill} characters)`)
      return
    }
    
    // Basic positivity check (simple implementation for now)
    const negativeWords = ['hate', 'terrible', 'awful', 'horrible', 'worst', 'stupid', 'dumb']
    const containsNegative = negativeWords.some(word => 
      fillText.toLowerCase().includes(word) || note.toLowerCase().includes(word)
    )
    if (containsNegative) {
      setError('Please keep your message positive and encouraging')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // TODO: Get actual user session data
      const senderAccountId = '0.0.5864559' // Demo account
      const senderHandle = 'demo_user'

      // Record template usage metrics and telemetry
      TemplateManager.recordTemplateUsage(selectedTemplate, 'use')
      
      // Track telemetry event with A/B group
      const { getOrAssignClientGroup } = await import('../lib/ab/abGroup')
      const testGroup = getOrAssignClientGroup()
      
      TemplateTelemetry.trackUsed({
        templateId: selectedTemplate,
        lens: templateObj.lens[0] || 'genz',
        context: templateObj.context,
        rarity: templateObj.rarity,
        category: templateObj.category,
        group: testGroup,
        userId: senderAccountId,
        fill: fillText
      })
      
      const result = await genzSignalService.sendGenzSignal({
        templateId: selectedTemplate,
        fill: fillText,
        note: note || undefined,
        recipientAccountId: recipient.accountId,
        recipientHandle: recipient.knsName || undefined,
        senderAccountId,
        senderHandle,
        // Add template metadata to payload
        lens: templateObj.lens[0] || 'genz',
        context: templateObj.context,
        rarity: templateObj.rarity
      })

      if (result.success) {
        setSuccess(true)
        console.log('[SendSignalModal] Signal sent successfully:', result)
        setTimeout(() => handleClose(), 2000) // Auto-close after 2s
      } else {
        setError(result.error || 'Failed to send signal')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('[SendSignalModal] Submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get selected template for character limits
  const selectedTemplateObj = templates.find(t => t.id === selectedTemplate)
  const maxFill = selectedTemplateObj?.maxFill || 40

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Props">
      <div className="p-6">
        {success ? (
          <div className="text-center py-8">
            <div className="text-green-600 text-xl mb-2">🔥 Props Sent!</div>
            <p className="text-gray-600">Your props are heading to the blockchain...</p>
          </div>
        ) : (
          <>
            {/* Template Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-3">
                What props are you sending?
              </label>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div key={template.id}>
                    <label className="flex items-start gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={selectedTemplate === template.id}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{template.text}</div>
                        <div className="text-xs text-gray-500 flex gap-2">
                          <span>Max {template.maxFill} chars</span>
                          <span>•</span>
                          <span className="capitalize">{template.rarity}</span>
                          {template.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{template.tags.slice(0, 2).join(', ')}</span>
                            </>
                          )}
                        </div>
                        {template.examples.length > 0 && selectedTemplate === template.id && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="text-xs text-gray-400 mb-1">Examples:</div>
                            <div className="flex gap-1 flex-wrap">
                              {template.examples.slice(0, 3).map((example, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setFillText(example)}
                                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                                >
                                  "{example}"
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Fill Input */}
            {selectedTemplate && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Fill in the blank: ({fillText.length}/{maxFill} chars)
                </label>
                <input
                  type="text"
                  value={fillText}
                  onChange={(e) => setFillText(e.target.value)}
                  maxLength={maxFill}
                  placeholder="What did they do amazingly?"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Say Why */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Say why (optional, {note.length}/120 chars):
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={120}
                placeholder="Tell them why they deserve these props..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Preview */}
            {selectedTemplate && fillText && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium mb-1">Preview:</div>
                <div className="text-sm">
                  {selectedTemplateObj?.text.replace('___', `"${fillText}"`)} 
                  {recipient?.knsName ? `for @${recipient.knsName}` : `for ${recipient?.accountId.slice(-6)}`}
                </div>
                {note && <div className="text-xs text-gray-600 mt-1">Note: {note}</div>}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedTemplate || !fillText.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending Props...' : 'Send Props 🔥'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default SendSignalModal