# Send Signals Modal - Implementation Guide

## Overview

The **SendSignalsModal** is a complete rewrite of the peer recommendation workflow that combines the excellent UX from `PeerRecommendationModal` with the new HCS-backed recognition system.

## Key Features

### ✅ What Was Kept (Great Workflow)
- **Contact Selection**: Dropdown to choose from bonded contacts
- **Category Filtering**: Browse 84 signals organized by Social, Academic, Professional, Civic
- **Visual Token Grid**: Clean 3-4 column grid with emoji icons and names
- **Signal Details**: Shows selected signal's full description, rarity, and trust value
- **Personal Message**: Optional text area for custom recognition message
- **Clear Send Button**: Single action to mint and send the signal

### ✨ What's New (HCS Integration)
- **Proper Signing**: Uses `signRecognitionPayload()` to sign with user's Hedera key
- **TRST Costs**: Minting costs TRST tokens (checked before submission)
- **On-Chain Storage**: Submits `SIGNAL_MINT` envelope to HCS SIGNAL topic
- **Transaction Receipt**: Returns Hedera transaction ID and updated balance
- **84 Signal Catalog**: Uses the complete v2 recognition signals from `/lib/data/recognitionSignals.ts`

## Architecture

### Data Flow

```
User selects contact & signal
          ↓
Sign with Hedera key
          ↓
POST /api/hcs/mint-recognition
          ↓
Check TRST balance
          ↓
Submit to HCS SIGNAL topic
          ↓
Debit TRST, return tx ID
          ↓
Toast success notification
```

### Components Used

1. **SendSignalsModal** (`/components/SendSignalsModal.tsx`)
   - Main modal component
   - Contact loading via `/api/circle`
   - Signal filtering and selection
   - HCS minting via `/api/hcs/mint-recognition`

2. **Recognition Signals** (`/lib/data/recognitionSignals.ts`)
   - 84 curated signals
   - 4 categories: social, academic, professional, civic
   - Each with: id, name, description, icon, trustValue, rarity, stats

3. **Sign Recognition** (`/lib/hedera/signRecognition.ts`)
   - Client-side payload signing
   - Uses user's Hedera account key
   - Generates signature + publicKey

4. **HCS Mint API** (`/app/api/hcs/mint-recognition/route.ts`)
   - Verifies signature
   - Checks TRST balance
   - Submits to HCS
   - Debits TRST
   - Returns transaction details

## Usage

### In Contacts Page

```tsx
import { SendSignalsModal } from '@/components/SendSignalsModal'

<SendSignalsModal>
  <Button>Send Signal</Button>
</SendSignalsModal>
```

The modal opens when the button is clicked, loads the user's bonded contacts, and allows them to:
1. Select a contact from their circle
2. Browse and filter 84 recognition signals
3. Optionally add a personal message
4. Send the signed signal to HCS

## Signal Categories

### Professional (24 signals)
- Leadership: Strategic Visionary, Team Catalyst, etc.
- Knowledge: Technical Expert, System Architect, etc.
- Execution: Delivery Champion, Revenue Driver, etc.

### Academic (18 signals)
- Scholarship: Research Contributor, Critical Thinker, etc.
- Study: Study Group Leader, Note Taker, etc.
- Collaboration: Project Coordinator, Peer Tutor, etc.

### Social (24 signals)
- Character: Shows Up, Honest Communicator, etc.
- Connection: Connector, Active Listener, etc.
- Energy: Positive Energy, Calm Presence, etc.

### Civic (18 signals)
- Community Service: Community Organizer, Volunteer Champion, etc.
- Civic Participation: Voter Mobilizer, Civic Educator, etc.
- Environmental: Sustainability Champion, Park Steward, etc.

## Trust Values

- **Common**: 0.2-0.3 trust units
- **Rare**: 0.4 trust units
- **Legendary**: 0.5 trust units

## TRST Costs

Minting a recognition signal costs TRST tokens. The exact cost is defined in `/lib/config/pricing.ts` and checked before allowing the mint.

## Signing Process

1. User initiates send
2. Client calls `signRecognitionPayload()` with:
   - `fromAccountId`: Sender's Hedera account
   - `toAccountId`: Recipient's Hedera account
   - `message`: Recognition message
   - `trustAmount`: Signal's trust value
   - `timestamp`: Current timestamp
3. Function returns `{ signature, publicKey, timestamp }`
4. Payload sent to server for verification

## Error Handling

- **No contacts**: Shows message "No bonded contacts found"
- **Not signed in**: Toast error "Please sign in to send signals"
- **Insufficient TRST**: API returns 402 Payment Required
- **Invalid signature**: API returns 401 Unauthorized
- **HCS failure**: Shows toast with error details

## Differences from Old System

### PeerRecommendationModal (Old)
- ❌ Used `genzRecognitionService` (not HCS-backed)
- ❌ No signature verification
- ❌ No TRST costs
- ❌ Different signal structure
- ✅ Great UX workflow

### SendSignalsModal (New)
- ✅ Uses HCS-backed recognition system
- ✅ Proper Hedera key signing
- ✅ TRST cost enforcement
- ✅ 84-signal v2 catalog
- ✅ Kept the great UX workflow
- ✅ Clean, modern design
- ✅ Full transaction transparency

## Future Enhancements

- [ ] Multi-signal selection (send multiple at once)
- [ ] Recent contacts shortcut
- [ ] Signal search/filter by keyword
- [ ] TRST balance indicator in modal
- [ ] Transaction history view
- [ ] NFT minting option for rare signals

## Testing

To test the modal:

1. Sign in with Magic
2. Add at least one contact via QR exchange
3. Click "Send Signal" button on contacts page
4. Select a contact from dropdown
5. Browse signals by category
6. Select a signal and add optional message
7. Click "Send Signal" to mint on HCS
8. Verify success toast and transaction ID

## Migration Notes

The old `PeerRecommendationModal` can remain in codebase for reference but is no longer used. The new `SendSignalsModal` is a drop-in replacement with the same trigger pattern (wrap a button/element).

---

**Created**: 2025-10-30
**Author**: AI Assistant
**Status**: ✅ Complete and integrated
