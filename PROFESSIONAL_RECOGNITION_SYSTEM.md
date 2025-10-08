# Professional Recognition System

## Overview
The Professional Recognition System enables users to send blockchain-verified professional endorsements to peers through Hedera Consensus Service (HCS), operating within TrustMesh's trust-based economy.

## Trust Token Economy
TrustMesh operates on a three-tier trust token system:
1. **Contact Tokens** = 1.0 trust unit (professional connections)
2. **Circle of 9** = 27.0 trust units each (staked to inner circle - 243 total)
3. **Recognition Tokens** = 0.1 to 0.5 trust units (skill-specific micro-endorsements)

## Features
- 21 comprehensive professional recognition tokens with variable trust values (0.3-0.5 units):
  - **Leadership** (7 tokens): Strategic Visionary, Team Catalyst, Decision Maker, Culture Builder, Change Champion, Talent Developer, Crisis Manager
  - **Knowledge** (7 tokens): Technical Expert, System Architect, Data Analyst, Domain Specialist, Continuous Learner, Research Pioneer, Quality Champion
  - **Execution** (7 tokens): Delivery Champion, Process Optimizer, Customer Advocate, Revenue Driver, Problem Solver, Bridge Builder, Risk Manager

## Architecture

### Components
1. **ProfessionalRecognitionService** (`lib/professionalRecognitionService.ts`)
   - Manages professional token definitions
   - Handles sending recognition to Hedera via HCS API
   - Validates recognition requests

2. **PeerRecommendationModal** (`components/PeerRecommendationModal.tsx`)
   - User interface for selecting tokens and composing messages
   - Integrates with the professional recognition service
   - Provides real-time feedback via toast notifications

### API Integration
The system uses the existing HCS Submit API (`/api/hcs/submit`) with:
- Message type: `RECOGNITION_MINT`
- Routing to appropriate HCS topics
- Envelope structure with sender validation and nonce protection

## How to Test

### 1. Access the Feature
1. Navigate to http://localhost:3000/contacts
2. Look for the "Expand Network" card
3. Click the "Recommend a Peer" button

### 2. Send a Professional Recognition
1. Enter peer information:
   - Full Name (required)
   - Email Address (optional)

2. Select recognition tokens:
   - Choose from 12 professional tokens
   - Multiple selections allowed
   - Each token shows category and description

3. Add personal message (optional):
   - Customize the recognition with a personal note

4. Submit:
   - Click "Send Professional Recognition"
   - System will process each token individually
   - Success/failure feedback via toast notifications

### 3. Verify on Hedera
Recognition messages are submitted to HCS and can be verified through:
- Console logs showing transaction sequence numbers
- Toast notifications confirming blockchain submission
- HCS mirror node queries (if configured)

## Token Categories & Descriptions

### Leadership (Vision, People Management, Decision Making)
- **Strategic Visionary** (0.5): Exceptional ability to see the big picture and guide long-term strategy
- **Team Catalyst** (0.5): Brings out the best in team members and drives collective success  
- **Decision Maker** (0.4): Makes sound decisions under pressure with limited information
- **Culture Builder** (0.4): Shapes positive organizational culture and values
- **Change Champion** (0.4): Successfully leads organizational transformation and adaptation
- **Talent Developer** (0.3): Exceptional at recruiting, developing and retaining top talent
- **Crisis Manager** (0.3): Remains calm and effective during high-pressure situations

### Knowledge (Expertise, Analysis, Learning)
- **Technical Expert** (0.5): Deep technical knowledge and ability to solve complex problems
- **System Architect** (0.5): Designs robust, scalable systems and technical solutions
- **Data Analyst** (0.4): Transforms complex data into actionable business insights
- **Domain Specialist** (0.4): Deep expertise in specific industry or functional area
- **Research Pioneer** (0.4): Conducts thorough research and develops innovative methodologies
- **Continuous Learner** (0.3): Always acquiring new skills and staying current with trends
- **Quality Champion** (0.3): Maintains exceptional standards and attention to detail

### Execution (Delivery, Operations, Results)  
- **Delivery Champion** (0.5): Consistently delivers projects on time and within scope
- **Revenue Driver** (0.5): Directly contributes to business growth and profitability
- **Process Optimizer** (0.4): Streamlines operations and eliminates inefficiencies
- **Customer Advocate** (0.4): Relentlessly focuses on customer satisfaction and success
- **Problem Solver** (0.4): Tackles challenges with creativity and systematic approach
- **Bridge Builder** (0.3): Connects stakeholders and facilitates cross-functional collaboration
- **Risk Manager** (0.3): Identifies and mitigates potential issues before they impact delivery

## Technical Implementation

### Service Methods
```typescript
// Send recognition to a peer
await professionalRecognitionService.sendRecognition({
  recipientId: 'peer-id',
  recipientName: 'John Smith',
  tokenId: 'strategic-visionary',
  message: 'Outstanding leadership during the project',
  senderId: 'sender-id', 
  senderName: 'Jane Doe'
})

// Get tokens by category
const tokensByCategory = professionalRecognitionService.getTokensByCategory()

// Validate recognition request
const validation = professionalRecognitionService.validateRecognitionRequest(request)
```

### HCS Message Structure
```json
{
  "type": "RECOGNITION_MINT",
  "from": "sender-account-id",
  "nonce": 1704123456789,
  "ts": 1704123456,
  "payload": {
    "definitionId": "strategic-visionary",
    "recipientId": "peer-id",
    "recipientName": "John Smith",
    "message": "Outstanding leadership during the project",
    "senderName": "Jane Doe",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "tokenMetadata": {
      "name": "Strategic Visionary",
      "description": "Exceptional ability to see the big picture...",
      "category": "leadership",
      "icon": "telescope"
    }
  }
}
```

## Future Enhancements
- Recognition token history and analytics
- Peer-to-peer recognition notifications
- Integration with professional credential systems
- Recognition leaderboards and achievements
- Export recognition reports for performance reviews

## Testing Scenarios

1. **Single Token Recognition**: Select one token and send
2. **Multiple Token Recognition**: Select several tokens and send batch
3. **Validation Testing**: Try submitting without required fields
4. **Network Error Handling**: Test with network disconnected
5. **Large Message Testing**: Send recognition with long personal messages

The system is now fully integrated and ready for testing on your local development environment at http://localhost:3000/contacts.