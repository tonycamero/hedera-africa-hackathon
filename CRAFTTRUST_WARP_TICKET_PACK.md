# 🚀 CraftTrust Treasury Warp Ticket Pack
## 13-Day Compressed Pilot Implementation

**Perfect for Warp execution** - Each ticket is scoped to a specific file or feature so Warp doesn't wander. Drop these in one at a time for focused, incremental progress.

---

## **Days 1-3: Wallet + RBAC Foundation**

### **Ticket 1 — MatterFi Wallet Service**
```warp-runnable-command
Create file: backend/src/services/matterfi-wallet.service.ts
Functions: createWallet(userId), getBalance(walletId), sendToName(walletId, recipientName, amount)
Integrate with Magic.link login (map Magic userId → MatterFi walletId)
Return mock data if SDK not connected yet.
```

**Expected Output:**
- TypeScript service class with MatterFi SDK integration
- Magic.link user ID to wallet ID mapping
- Mock responses for development environment
- Error handling for network failures

### **Ticket 2 — RBAC Scope Service**
```warp-runnable-command
Create file: backend/src/shared/treasury/rbac/capability.service.ts
Add schema for user_facility_capabilities table
Implement checkCapability(userId, facilityId, scope) → boolean
Scopes: treasury:balances.read, treasury:tx.create, treasury:config.write
```

**Expected Output:**
- Database schema migration for capability overlay
- RBAC service with scope validation
- Treasury permission matrix implementation
- Integration with existing CraftTrust roles

### **Ticket 3 — Treasury Resolver Extension**
```warp-runnable-command
Modify backend/src/shared/treasury/treasury.resolver.ts
Add @HasScope decorators to queries/mutations
Add walletOverview() query (returns TRST balance)
Add sendTrstToName() mutation (uses MatterFi service)
```

**Expected Output:**
- GraphQL resolver with scope-based authorization
- Wallet balance query with real-time data
- Send-to-name functionality for TRST transfers
- Integration with RBAC capability service

### **Ticket 4 — Frontend Balance + Send Cards**
```warp-runnable-command
Create frontend/src/components/Treasury/TreasuryBalanceCard.tsx
Show TRST balance from walletOverview()
Create frontend/src/components/Treasury/SendTrstCard.tsx
Form: recipientName, amount → calls sendTrstToName()
Add validation + success/failure toast
```

**Expected Output:**
- React components with Tailwind CSS styling
- Real-time balance display with loading states
- Send form with input validation
- Toast notifications for transaction status

---

## **Days 4-6: Brale Mint Integration**

### **Ticket 5 — Brale Client Service**
```warp-runnable-command
Create file: backend/src/services/brale-client.service.ts
Functions: requestMint(amount, facilityId), getMintStatus(mintId), confirmMint(mintId)
Use Brale sandbox creds from .env.local
If sandbox not connected, return mock data
```

**Expected Output:**
- Brale API client with sandbox integration
- Mint request workflow with status tracking
- Mock data fallback for development
- Error handling and retry logic

### **Ticket 6 — Custody Proof Mock Service**
```warp-runnable-command
Create file: backend/src/services/custody-proof-mock.service.ts
Function: generateCustodyReceipt(facilityId, amount)
Return JSON receipt { facilityId, amount, timestamp, receiptId }
Dev resolver mutation: devMintTrst(amount, facilityId) → calls requestMint + mock custody proof
```

**Expected Output:**
- Mock custody proof generation for testing
- JSON receipt format matching Brinks standard
- Development-only mint endpoint
- Integration with Brale mint workflow

### **Ticket 7 — Frontend Mint/Settlement Cards**
```warp-runnable-command
Create frontend/src/components/Treasury/MintRequestCard.tsx
Form: request TRST mint → calls requestTrstMint()
Create frontend/src/components/Treasury/SettlementSummaryCard.tsx
Table: pending mints, custody proof status, history
```

**Expected Output:**
- Mint request form with amount validation
- Real-time settlement status display
- Transaction history table with filtering
- Loading states and error handling

---

## **Days 7-9: Audit Trail & Compliance**

### **Ticket 8 — Compliance Export Service**
```warp-runnable-command
Create file: backend/src/services/compliance-export.service.ts
Function: exportTreasuryCSV(facilityId, dateRange)
Fetch TRST transfers from MatterFi/Hedera API
Write CSV: txHash, from, to, amount, timestamp
Return file stream
```

**Expected Output:**
- CSV export service with date range filtering
- Hedera transaction data integration
- Compliance-ready format for regulators
- File streaming for large exports

### **Ticket 9 — Compliance Status Card**
```warp-runnable-command
Create frontend/src/components/Treasury/ComplianceStatusCard.tsx
Show KYB status (mocked string for now)
Download button → calls exportTreasuryCSV() → downloads CSV
```

**Expected Output:**
- Compliance dashboard with KYB status
- CSV download functionality
- Date range picker for exports
- Progress indicators for file generation

---

## **Days 10-11: Demo Preparation**

### **Ticket 10 — Demo Seed Data**
```warp-runnable-command
Create file: backend/src/seeds/demo-treasury-data.seed.ts
Seed facility: Green Valley Dispensary
Seed users: Owner, Manager, Clerk (with roles)
Seed transactions: sample mint + transfers
```

**Expected Output:**
- Demo facility with cannabis-specific data
- User accounts with appropriate treasury scopes
- Sample transaction history for demonstration
- Realistic data for all user roles

### **Ticket 11 — Demo Environment Configuration**
```warp-runnable-command
Create file: .env.demo
Include: Brale sandbox keys, Brinks mock toggle, MatterFi testnet URL
Set feature flags: ENABLE_DEMO=true
```

**Expected Output:**
- Complete demo environment configuration
- All necessary API keys and endpoints
- Feature flags for demo-specific functionality
- Documentation for environment setup

### **Ticket 12 — Demo Script Documentation**
```warp-runnable-command
Create file: DEMO_SCRIPT.md
Document flow:
1. Login (Owner, Manager, Clerk)
2. Deposit cash (mock Brinks) → Mint TRST
3. TRST shows in balance
4. Send TRST via Send-to-Name
5. Export CSV compliance report
```

**Expected Output:**
- Step-by-step demo script with screenshots
- Role-specific workflows and permissions
- Expected outcomes for each demo step
- Troubleshooting guide for common issues

---

## **Days 12-13: Quality Assurance & Rehearsal**

### **Ticket 13 — End-to-End Testing & Validation**
```warp-runnable-command
Test each role: Owner, Manager, Clerk
Verify card visibility matches scopes
Run end-to-end: Deposit → Mint → Send → Export
Document issues + fixes
```

**Expected Output:**
- Complete QA test results by role
- RBAC validation across all components
- End-to-end flow verification
- Issue log with resolutions

---

## 🎯 **Execution Strategy**

### **Warp Integration Guidelines**
- **1-2 tickets per day** with focused Warp prompts
- Keep prompts scoped to exact file + function specifications
- You act as QA: run locally, verify functionality, iterate as needed
- Each ticket builds on previous work incrementally

### **Daily Workflow**
1. **Morning**: Select next ticket from pack
2. **Implementation**: Use Warp for code generation
3. **Testing**: Verify functionality locally  
4. **Integration**: Ensure compatibility with existing code
5. **Documentation**: Update progress and any deviations

### **Success Metrics**
- ✅ All 13 tickets completed on schedule
- ✅ End-to-end demo flow working seamlessly
- ✅ RBAC properly enforced across all roles
- ✅ Compliance export generating accurate data
- ✅ Ready for partner demo presentation

---

## 📋 **Treasury Role Mapping Reference**

Based on the external context, here's the RBAC overlay for CraftTrust integration:

| Treasury Role | Base CraftTrust Role | Key Scopes |
|---------------|---------------------|------------|
| OWNER | Admin (facility/org) | treasury:config.write, treasury:dev.mint |
| FINANCE_MANAGER | Employee | treasury:tx.create, treasury:export |
| CLERK | Employee | treasury:invoice.create, treasury:balances.read |
| VIEWER | Client/Employee | treasury:read (read-only, no export) |

### **Database Schema Extension**
```sql
-- Minimal overlay for treasury capabilities
CREATE TABLE IF NOT EXISTS user_facility_capabilities (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  facility_id BIGINT NOT NULL,
  capability_namespace TEXT NOT NULL,   -- e.g., 'treasury'
  scopes TEXT[] NOT NULL,               -- array of scope strings
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, facility_id, capability_namespace)
);
```

---

## 🚀 **Ready for Warp Execution**

This ticket pack provides:
- **Granular, actionable tasks** perfect for Warp's focused execution
- **Clear deliverables** for each ticket with expected outputs
- **Incremental progress** building toward complete demo
- **Integration checkpoints** ensuring compatibility

**By Day 13, you'll have a complete CraftTrust Treasury demo ready for partner presentation!**

---

*CraftTrust Treasury Warp Ticket Pack developed for rapid 13-day pilot execution with AI-assisted development.*