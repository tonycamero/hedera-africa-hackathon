# 💰 CraftTrust Treasury Integration Guide
## Sprint-by-Sprint Execution for Brinks + Brale + MatterFi Pilot

**Objective**: Demonstrate a compliant, Web3-native treasury system for cannabis operators that combines **MatterFi wallet infrastructure**, **Brale custodial minting**, and **Brinks physical cash custody**.

---

## 🎯 Pilot Scope Overview

### Core Integration Flow
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Cash Deposit   │    │   Custody &     │    │   Digital       │
│  (Brinks        │───▶│   Minting       │───▶│   Treasury      │
│   Recycler)     │    │  (Brale API)    │    │  (MatterFi)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
    Physical Cash          Custody Proof            TRST Balance
    Bank-grade Security    1:1 USD Backing         Ready for Payments
```

### Success Metrics
- ✅ End-to-end cash → TRST → transfer → redemption flow executed
- ✅ Audit trail generated, regulator-readable
- ✅ RBAC roles validated: Owner, Finance Manager, Clerk
- ✅ Brale, Brinks, and MatterFi components each exercised in live demo

### Timeline: 60 days + optional 30-day extension
- **Week 1-2**: Wallet auth + balance/send UI
- **Week 3-4**: Brale mint integration (custodial API)
- **Week 5-6**: Brinks cash recycler → mint workflow stub
- **Week 7-8**: Audit trail + compliance export
- **Week 9**: Demo and regulatory review

---

## 🏗️ Technical Architecture

### Role-Based Access Control (RBAC) Overlay

```typescript
// Treasury Role Mapping over existing CraftTrust roles
interface TreasuryRoleMapping {
  OWNER: 'Admin';              // Full control + config; retains Admin elsewhere
  FINANCE_MANAGER: 'Employee'; // Day-to-day ops; no treasury config  
  CLERK: 'Employee';           // Create invoices/requests only
  VIEWER: 'Client | Employee'; // Auditors/regulators; read-only export disabled
}

// Permission Matrix
interface TreasuryPermissions {
  'treasury:read': boolean;
  'treasury:balances.read': boolean;
  'treasury:tx.read': boolean;
  'treasury:tx.create': boolean;            // send TRST / schedule recurring
  'treasury:invoice.create': boolean;
  'treasury:invoice.read': boolean;
  'treasury:settlement.read': boolean;      // custody proofs / Brinks status
  'treasury:config.write': boolean;         // policy, limits, roles
  'treasury:export': boolean;               // accounting/tax exports
  'treasury:dev.mint': boolean;             // NON-PROD only (feature-flagged)
  'treasury:compliance.read': boolean;      // KYB/KYC, filing status
  'treasury:compliance.write': boolean;     // policy toggles, attestations
}
```

### Database Schema Extension

```sql
-- Minimal schema extension for RBAC overlay
CREATE TABLE IF NOT EXISTS user_facility_capabilities (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  facility_id BIGINT NOT NULL,
  capability_namespace TEXT NOT NULL,   -- e.g., 'treasury'
  scopes TEXT[] NOT NULL,               -- array of scope strings
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, facility_id, capability_namespace)
);

-- Treasury transaction log
CREATE TABLE IF NOT EXISTS treasury_transactions (
  id BIGSERIAL PRIMARY KEY,
  facility_id BIGINT NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,  -- Hedera transaction ID
  transaction_type TEXT NOT NULL,       -- 'mint', 'transfer', 'burn'
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRST',
  from_wallet TEXT,
  to_wallet TEXT,
  custody_proof_id TEXT,                -- Link to Brinks custody proof
  brale_mint_id TEXT,                   -- Link to Brale minting record
  user_id BIGINT NOT NULL,              -- Who initiated
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB                        -- Additional compliance data
);

-- Audit trail for compliance
CREATE TABLE IF NOT EXISTS treasury_audit_events (
  id BIGSERIAL PRIMARY KEY,
  facility_id BIGINT NOT NULL,
  event_type TEXT NOT NULL,             -- 'access', 'transaction', 'config_change'
  user_id BIGINT NOT NULL,
  resource_type TEXT NOT NULL,          -- 'wallet', 'transaction', 'policy'
  resource_id TEXT NOT NULL,
  action TEXT NOT NULL,                 -- 'create', 'read', 'update', 'delete'
  before_state JSONB,
  after_state JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 📅 Sprint-by-Sprint Implementation

### **Sprint 1-2: Wallet Authentication + Balance UI** (Week 1-2)

#### Goals:
- Magic.link login creates Hedera wallet via MatterFi SDK
- Users authenticated by role (Owner/Manager/Clerk)
- Basic balance dashboard shows live TRST holdings

#### Technical Implementation:

```typescript
// services/walletAuth.ts
import { MatterFiSDK } from '@matterfi/sdk';
import { Magic } from 'magic-sdk';

export class TreasuryWalletService {
  private magic: Magic;
  private matterFi: MatterFiSDK;

  constructor() {
    this.magic = new Magic(process.env.MAGIC_PUBLISHABLE_KEY!);
    this.matterFi = new MatterFiSDK({
      network: 'hedera-testnet',
      apiKey: process.env.MATTERFI_API_KEY!
    });
  }

  async authenticateUser(email: string): Promise<WalletAuth> {
    // 1. Magic.link authentication
    const didToken = await this.magic.auth.loginWithMagicLink({ email });
    
    // 2. Create/retrieve Hedera wallet via MatterFi
    const wallet = await this.matterFi.wallets.createOrRetrieve({
      userEmail: email,
      walletType: 'hedera'
    });

    // 3. Store wallet mapping
    await this.storeFacilityWalletMapping(email, wallet.address);

    return {
      didToken,
      walletAddress: wallet.address,
      privateKey: wallet.privateKey, // Encrypted, user-controlled
      publicKey: wallet.publicKey
    };
  }

  async getTRSTBalance(walletAddress: string): Promise<TokenBalance> {
    return await this.matterFi.balances.getTokenBalance({
      walletAddress,
      tokenId: process.env.TRST_TOKEN_ID!
    });
  }
}
```

#### UI Components:

```typescript
// components/treasury/TreasuryDashboard.tsx
import { userHas } from '@/services/acl';

export const TreasuryDashboard: React.FC<{scopes: string[]}> = ({ scopes }) => {
  const cards = [];

  if (userHas(scopes, 'treasury:balances.read')) {
    cards.push(<TreasuryBalanceCard />);
  }
  
  if (userHas(scopes, 'treasury:tx.create')) {
    cards.push(<PaymentQueueCard />, <RecurringPaymentsCard />);
  }
  
  if (userHas(scopes, 'treasury:settlement.read')) {
    cards.push(<SettlementSummaryCard />);
  }

  if (userHas(scopes, 'treasury:compliance.read')) {
    cards.push(<ComplianceStatusCard />);
  }

  // Owner-only components
  if (userHas(scopes, 'treasury:config.write')) {
    cards.push(<TreasuryPolicyCard />, <CashFlowProjectionCard />);
  }

  return (
    <div className="treasury-dashboard grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards}
    </div>
  );
};
```

#### Sprint 1-2 Deliverables:
- [ ] Magic.link + MatterFi wallet creation flow
- [ ] RBAC permission system implementation
- [ ] Treasury dashboard with role-based card display
- [ ] Live TRST balance display
- [ ] Basic send/receive TRST interface
- [ ] Unit tests for authentication flow

---

### **Sprint 3-4: Brale Mint Integration** (Week 3-4)

#### Goals:
- Cash deposited into Brinks recycler → mint request sent via Brale
- TRST stablecoin minted and delivered to facility's wallet
- Custodial compliance integration

#### Technical Implementation:

```typescript
// services/braleMinting.ts
import { BraleAPI } from '@brale/sdk';

export class BraleMintingService {
  private brale: BraleAPI;

  constructor() {
    this.brale = new BraleAPI({
      apiKey: process.env.BRALE_API_KEY!,
      environment: 'sandbox' // 'production' for live
    });
  }

  async initiateMint(request: MintRequest): Promise<MintResponse> {
    // 1. Verify custody proof from Brinks
    const custodyVerified = await this.verifyCustodyProof(request.custodyProofId);
    if (!custodyVerified) {
      throw new Error('Custody proof verification failed');
    }

    // 2. Request TRST minting via Brale
    const mintRequest = await this.brale.stablecoin.mint({
      amount: request.usdAmount,
      currency: 'USD',
      targetWallet: request.destinationWallet,
      custodyReference: request.custodyProofId,
      compliance: {
        kybStatus: request.kybStatus,
        facilityLicense: request.facilityLicense,
        regulatoryJurisdiction: request.jurisdiction
      }
    });

    // 3. Record transaction in audit trail
    await this.recordMintTransaction(mintRequest);

    return mintRequest;
  }

  private async verifyCustodyProof(proofId: string): Promise<boolean> {
    // Integration with Brinks custody API
    const custodyStatus = await this.brinks.custody.verify(proofId);
    return custodyStatus.status === 'verified' && custodyStatus.amount > 0;
  }

  async getMintStatus(mintId: string): Promise<MintStatus> {
    return await this.brale.stablecoin.getStatus(mintId);
  }
}
```

#### Brale Integration Flow:

```typescript
// workflows/cashToTRSTFlow.ts
export class CashToTRSTWorkflow {
  async processCashDeposit(depositEvent: CashDepositEvent): Promise<WorkflowResult> {
    const steps = [
      'verify_brinks_custody',
      'validate_kyb_compliance', 
      'request_brale_mint',
      'confirm_wallet_delivery',
      'update_balance_dashboard',
      'log_audit_trail'
    ];

    const results = [];
    
    for (const step of steps) {
      try {
        const result = await this.executeStep(step, depositEvent);
        results.push({ step, status: 'success', result });
      } catch (error) {
        results.push({ step, status: 'failed', error: error.message });
        // Implement rollback logic
        await this.rollbackPreviousSteps(results.filter(r => r.status === 'success'));
        throw new Error(`Workflow failed at step: ${step}`);
      }
    }

    return { status: 'completed', steps: results };
  }
}
```

#### Sprint 3-4 Deliverables:
- [ ] Brale SDK integration and configuration
- [ ] Cash deposit → mint workflow implementation
- [ ] Custody proof verification system
- [ ] KYB compliance validation
- [ ] Real-time mint status tracking
- [ ] Error handling and rollback mechanisms
- [ ] Integration tests with Brale sandbox

---

### **Sprint 5-6: Brinks Cash Recycler Integration** (Week 5-6)

#### Goals:
- Physical cash recycler → mint workflow integration
- Real-time custody status and pickup scheduling
- Cash capacity monitoring and alerts

#### Technical Implementation:

```typescript
// services/brinksIntegration.ts
export class BrinksRecyclerService {
  private brinksAPI: BrinksAPI;

  constructor() {
    this.brinksAPI = new BrinksAPI({
      facilityId: process.env.BRINKS_FACILITY_ID!,
      apiCredentials: process.env.BRINKS_API_CREDENTIALS!
    });
  }

  async monitorCashDeposits(): Promise<void> {
    // Real-time monitoring of cash recycler events
    const eventStream = this.brinksAPI.events.subscribe('cash_deposit');
    
    eventStream.on('deposit', async (event: CashDepositEvent) => {
      try {
        // 1. Generate custody proof
        const custodyProof = await this.generateCustodyProof(event);
        
        // 2. Trigger TRST minting workflow
        const mintWorkflow = new CashToTRSTWorkflow();
        await mintWorkflow.processCashDeposit({
          ...event,
          custodyProofId: custodyProof.id
        });

        // 3. Update dashboard in real-time
        await this.notifyTreasuryDashboard(event);

      } catch (error) {
        await this.handleDepositError(event, error);
      }
    });
  }

  async getCashRecyclerStatus(): Promise<RecyclerStatus> {
    const status = await this.brinksAPI.recycler.getStatus();
    
    return {
      capacity: {
        current: status.cashAmount,
        maximum: status.maxCapacity,
        utilizationPercent: (status.cashAmount / status.maxCapacity) * 100
      },
      nextPickup: status.scheduledPickup,
      operationalStatus: status.status,
      lastMaintenance: status.lastMaintenance,
      alerts: status.alerts || []
    };
  }

  async schedulePickup(amount: number, urgency: 'standard' | 'expedited'): Promise<PickupSchedule> {
    return await this.brinksAPI.pickup.schedule({
      facilityId: process.env.BRINKS_FACILITY_ID!,
      requestedAmount: amount,
      urgency,
      requestedBy: 'treasury_system'
    });
  }
}
```

#### Real-Time Dashboard Integration:

```typescript
// components/treasury/SettlementSummaryCard.tsx
export const SettlementSummaryCard: React.FC = () => {
  const [recyclerStatus, setRecyclerStatus] = useState<RecyclerStatus | null>(null);
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);

  useEffect(() => {
    // Real-time updates via WebSocket
    const ws = new WebSocket(process.env.NEXT_PUBLIC_TREASURY_WS_URL!);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'recycler_status_update') {
        setRecyclerStatus(data.payload);
      }
      
      if (data.type === 'deposit_detected') {
        setPendingDeposits(prev => [...prev, data.payload]);
      }
      
      if (data.type === 'mint_completed') {
        setPendingDeposits(prev => 
          prev.filter(deposit => deposit.id !== data.payload.depositId)
        );
      }
    };

    return () => ws.close();
  }, []);

  return (
    <Card className="treasury-settlement-card">
      <CardHeader>
        <CardTitle>Cash Settlement Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Cash Recycler Status */}
          <div className="recycler-status">
            <h4>Brinks Recycler</h4>
            <div className="capacity-bar">
              <div 
                className="capacity-fill"
                style={{width: `${recyclerStatus?.capacity.utilizationPercent}%`}}
              />
            </div>
            <p>Capacity: ${recyclerStatus?.capacity.current.toLocaleString()} / ${recyclerStatus?.capacity.maximum.toLocaleString()}</p>
            <p>Next Pickup: {recyclerStatus?.nextPickup ? new Date(recyclerStatus.nextPickup).toLocaleDateString() : 'Not scheduled'}</p>
          </div>

          {/* Pending Deposits */}
          <div className="pending-deposits">
            <h4>Pending TRST Minting</h4>
            {pendingDeposits.map(deposit => (
              <div key={deposit.id} className="deposit-item">
                <span>${deposit.amount.toLocaleString()}</span>
                <span className="status">{deposit.status}</span>
                <span className="timestamp">{new Date(deposit.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

#### Sprint 5-6 Deliverables:
- [ ] Brinks recycler API integration
- [ ] Real-time cash deposit monitoring
- [ ] Automatic mint workflow triggers
- [ ] Cash capacity and pickup scheduling
- [ ] WebSocket real-time dashboard updates
- [ ] Recycler status monitoring and alerts
- [ ] Integration testing with physical recycler

---

### **Sprint 7-8: Audit Trail + Compliance Export** (Week 7-8)

#### Goals:
- All TRST transactions logged immutably on Hedera
- Parallel audit log generated (DB + blockchain proofs)
- Exportable compliance report (CSV/PDF) for regulators

#### Technical Implementation:

```typescript
// services/auditTrail.ts
import { Client, TransactionId } from '@hashgraph/sdk';

export class TreasuryAuditService {
  private hederaClient: Client;

  constructor() {
    this.hederaClient = Client.forTestnet(); // or forMainnet() in production
  }

  async logTransaction(transaction: TreasuryTransaction): Promise<AuditEntry> {
    // 1. Create audit entry with minimal PII
    const auditEntry = {
      id: generateUUID(),
      facilityId: transaction.facilityId,
      transactionType: transaction.type,
      amount: transaction.amount,
      currency: 'TRST',
      timestamp: new Date().toISOString(),
      hederaTransactionId: transaction.hederaTransactionId,
      custodyProofHash: transaction.custodyProofId ? sha256(transaction.custodyProofId) : null,
      userRole: transaction.userRole, // Not user ID for privacy
      complianceFlags: transaction.complianceFlags || []
    };

    // 2. Store in database for queries
    await this.storeAuditEntry(auditEntry);

    // 3. Create immutable proof on Hedera HCS
    const hcsProof = await this.createHederaProof(auditEntry);

    // 4. Link database entry to blockchain proof
    await this.linkProof(auditEntry.id, hcsProof.transactionId);

    return { ...auditEntry, hederaProof: hcsProof.transactionId };
  }

  private async createHederaProof(auditEntry: AuditEntry): Promise<HCSProof> {
    const auditHash = sha256(JSON.stringify(auditEntry));
    
    const transaction = await new TopicMessageSubmitTransaction()
      .setTopicId(process.env.TREASURY_AUDIT_TOPIC_ID!)
      .setMessage(auditHash)
      .execute(this.hederaClient);

    return {
      transactionId: transaction.transactionId.toString(),
      topicId: process.env.TREASURY_AUDIT_TOPIC_ID!,
      messageHash: auditHash,
      timestamp: new Date().toISOString()
    };
  }

  async generateComplianceReport(request: ComplianceReportRequest): Promise<ComplianceReport> {
    const { facilityId, startDate, endDate, reportType } = request;

    // 1. Query audit trail from database
    const auditEntries = await this.queryAuditTrail({
      facilityId,
      startDate,
      endDate,
      includeHederaProofs: true
    });

    // 2. Verify blockchain proofs
    const verifiedEntries = await Promise.all(
      auditEntries.map(async (entry) => ({
        ...entry,
        blockchainVerified: await this.verifyHederaProof(entry.hederaProof!)
      }))
    );

    // 3. Generate compliance-specific aggregations
    const summary = this.generateComplianceSummary(verifiedEntries);

    // 4. Export in requested format
    const report = {
      facilityId,
      reportPeriod: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      summary,
      transactions: verifiedEntries,
      verificationStatus: {
        totalTransactions: verifiedEntries.length,
        blockchainVerified: verifiedEntries.filter(t => t.blockchainVerified).length,
        integrityScore: this.calculateIntegrityScore(verifiedEntries)
      }
    };

    // 5. Export to requested format
    switch (reportType) {
      case 'csv':
        return { format: 'csv', data: await this.exportToCSV(report) };
      case 'pdf':
        return { format: 'pdf', data: await this.exportToPDF(report) };
      case 'json':
        return { format: 'json', data: report };
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  private generateComplianceSummary(transactions: VerifiedAuditEntry[]): ComplianceSummary {
    return {
      totalVolume: transactions.reduce((sum, t) => sum + t.amount, 0),
      transactionCount: transactions.length,
      mintOperations: transactions.filter(t => t.transactionType === 'mint').length,
      transferOperations: transactions.filter(t => t.transactionType === 'transfer').length,
      burnOperations: transactions.filter(t => t.transactionType === 'burn').length,
      avgTransactionAmount: transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length,
      complianceFlags: this.aggregateComplianceFlags(transactions),
      custodyProofsCoverage: this.calculateCustodyProofsCoverage(transactions)
    };
  }
}
```

#### Compliance Export Interface:

```typescript
// components/treasury/ComplianceExportCard.tsx
export const ComplianceExportCard: React.FC = () => {
  const [exportParams, setExportParams] = useState<ExportParams>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
    reportType: 'pdf'
  });

  const handleExportCompliance = async () => {
    try {
      const report = await treasuryAuditService.generateComplianceReport({
        facilityId: getCurrentFacilityId(),
        ...exportParams
      });

      // Download the report
      const blob = new Blob([report.data], { 
        type: report.format === 'pdf' ? 'application/pdf' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `treasury-compliance-${format(exportParams.startDate, 'yyyy-MM-dd')}-to-${format(exportParams.endDate, 'yyyy-MM-dd')}.${report.format}`;
      a.click();

    } catch (error) {
      toast.error('Failed to generate compliance report');
    }
  };

  return (
    <Card className="compliance-export-card">
      <CardHeader>
        <CardTitle>Compliance Reporting</CardTitle>
        <CardDescription>
          Generate auditable reports with blockchain verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="date-range-picker">
            <Label>Report Period</Label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={format(exportParams.startDate, 'yyyy-MM-dd')}
                onChange={(e) => setExportParams(prev => ({
                  ...prev,
                  startDate: new Date(e.target.value)
                }))}
              />
              <input
                type="date"
                value={format(exportParams.endDate, 'yyyy-MM-dd')}
                onChange={(e) => setExportParams(prev => ({
                  ...prev,
                  endDate: new Date(e.target.value)
                }))}
              />
            </div>
          </div>

          <div className="format-selector">
            <Label>Export Format</Label>
            <Select
              value={exportParams.reportType}
              onValueChange={(value: 'csv' | 'pdf' | 'json') => 
                setExportParams(prev => ({ ...prev, reportType: value }))
              }
            >
              <SelectItem value="pdf">PDF (Regulator Friendly)</SelectItem>
              <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
              <SelectItem value="json">JSON (Raw Data)</SelectItem>
            </Select>
          </div>

          <Button onClick={handleExportCompliance} className="w-full">
            Generate Compliance Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

#### Sprint 7-8 Deliverables:
- [ ] Hedera HCS audit trail implementation
- [ ] Database audit log with blockchain proofs
- [ ] Compliance report generation (PDF/CSV/JSON)
- [ ] Blockchain verification system
- [ ] Cannabis-specific compliance metadata
- [ ] Export UI with date range and format selection
- [ ] Automated integrity scoring system

---

### **Sprint 9: Demo and Regulatory Review** (Week 9)

#### Goals:
- Live demonstration of full cash → TRST → payment flow
- Regulatory stakeholder review and feedback
- Performance testing and optimization
- Production readiness assessment

#### Demo Script:

```markdown
# CraftTrust Treasury Demo Script

## Act 1: Cash Deposit & Minting (5 minutes)
1. **Physical Cash Deposit**: 
   - Show Brinks recycler accepting $1,000 cash
   - Real-time dashboard updates showing deposit detection
   
2. **Custody & Minting**:
   - Custody proof generated automatically
   - Brale API mints 1,000 TRST tokens
   - MatterFi wallet receives tokens within 30 seconds

## Act 2: Treasury Operations (5 minutes)  
3. **Role-Based Access**:
   - Login as Finance Manager → show restricted permissions
   - Login as Owner → show full treasury configuration access
   
4. **Payment Processing**:
   - Send 500 TRST to vendor wallet using "Send-to-Name" 
   - Show real-time transaction confirmation on Hedera

## Act 3: Compliance & Audit (5 minutes)
5. **Audit Trail**:
   - Generate compliance report for demo transactions
   - Show PDF export with blockchain verification proofs
   - Display Hedera transaction IDs for immutable audit

6. **Regulatory Dashboard**:
   - Cannabis-specific compliance metadata
   - Seed-to-sale traceability integration
   - Real-time settlement status

## Q&A and Technical Deep-dive (5 minutes)
```

#### Performance Benchmarks:

| Metric | Target | Demo Result |
|--------|--------|-------------|
| Cash → TRST Minting | <60 seconds | ___ seconds |
| TRST Transfer Confirmation | <10 seconds | ___ seconds |
| Compliance Report Generation | <30 seconds | ___ seconds |
| Dashboard Real-time Updates | <2 seconds | ___ seconds |
| Blockchain Proof Verification | <5 seconds | ___ seconds |

#### Sprint 9 Deliverables:
- [ ] Complete end-to-end demo environment
- [ ] Performance benchmarks achieved
- [ ] Regulatory stakeholder feedback collected
- [ ] Production deployment checklist
- [ ] Security audit recommendations
- [ ] Post-demo improvement roadmap

---

## 🎯 Post-Pilot Expansion Roadmap

### Phase 2: Advanced Features (Month 2-3)
- [ ] TrustMesh integration for trust-based payment terms
- [ ] Zero-knowledge compliance proofs
- [ ] Advanced treasury analytics and forecasting
- [ ] Multi-currency support beyond TRST

### Phase 3: Scale & Integration (Month 3-6)
- [ ] Multi-state cannabis operator rollout
- [ ] Integration with existing cannabis POS systems
- [ ] Advanced workflow automation via Context Engine
- [ ] Cross-facility treasury consolidation

### Phase 4: Ecosystem Expansion (Month 6-12)
- [ ] Municipal treasury use cases
- [ ] Other regulated industry adaptations
- [ ] Open API for third-party integrations
- [ ] White-label treasury platform offering

---

## 🔧 Technical Environment Setup

### Development Environment Variables

```env
# Magic.link Authentication
MAGIC_PUBLISHABLE_KEY=pk_live_xxxxx
MAGIC_SECRET_KEY=sk_live_xxxxx

# MatterFi Wallet Infrastructure  
MATTERFI_API_KEY=matterfi_xxxxx
MATTERFI_NETWORK=hedera-testnet

# Brale Stablecoin Minting
BRALE_API_KEY=brale_xxxxx
BRALE_ENVIRONMENT=sandbox
TRST_TOKEN_ID=0.0.xxxxxx

# Brinks Cash Recycler
BRINKS_FACILITY_ID=facility_xxxxx
BRINKS_API_CREDENTIALS=brinks_xxxxx

# Hedera Network
HEDERA_ACCOUNT_ID=0.0.xxxxxx
HEDERA_PRIVATE_KEY=xxxxx
TREASURY_AUDIT_TOPIC_ID=0.0.xxxxxx

# Feature Flags
FEATURE_TREASURY_DEV_MINT=false
TREASURY_STRICT_MODE=true
```

### Deployment Architecture

```yaml
# docker-compose.treasury.yml
version: '3.8'
services:
  treasury-api:
    build: ./treasury-service
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
      - redis

  treasury-ui:
    build: ./treasury-frontend  
    environment:
      - NEXT_PUBLIC_API_URL=${API_URL}
    ports:
      - "3000:3000"

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: crafttrust_treasury
    volumes:
      - treasury_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  treasury_data:
  redis_data:
```

---

## 🎯 Success Metrics & KPIs

### Technical KPIs
- **System Uptime**: >99.9% during business hours
- **Transaction Processing**: <10 second confirmation times
- **Audit Trail Integrity**: 100% blockchain verification success
- **User Authentication**: <3 second login via Magic.link

### Business KPIs  
- **Cash Processing Efficiency**: 50% reduction in manual cash handling
- **Compliance Readiness**: <24 hour audit report generation
- **User Adoption**: >80% facility staff trained and using system
- **Regulatory Acceptance**: Positive feedback from 2+ regulatory bodies

### Compliance KPIs
- **Audit Trail Coverage**: 100% of treasury transactions logged
- **KYB Compliance**: 100% vendor verification before payments
- **Regulatory Reporting**: Automated generation meeting state requirements
- **Data Integrity**: Zero discrepancies between physical and digital records

---

## 🔚 Conclusion: Treasury Infrastructure for Cannabis Innovation

The CraftTrust Treasury Integration represents a **fundamental shift** from cash-heavy, manually-intensive cannabis operations to **compliant, automated, digital treasury management**.

By combining **Brinks physical security**, **Brale regulatory compliance**, and **MatterFi Web3 infrastructure**, cannabis operators gain:

- **Regulatory Confidence**: Immutable audit trails and automated compliance reporting
- **Operational Efficiency**: 60-second cash-to-digital conversion with real-time dashboards  
- **Financial Innovation**: Trust-based payment terms and cross-facility treasury management
- **Future Readiness**: Web3-native infrastructure that scales beyond cannabis

This pilot validates the **technical feasibility** and **regulatory acceptability** of blockchain-based treasury systems for highly regulated industries, establishing the foundation for broader **Civic Trust Stack** deployment.

---

*Implementation guide developed for the TrustMesh → Scend → Hedera sovereignty infrastructure, enabling compliant treasury automation for regulated industries.*