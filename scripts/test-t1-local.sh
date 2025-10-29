#!/bin/bash
# Quick T1 Local Test - Run immediately without waiting

set -e

echo "🧪 HCS-22 Phase 4 T1 Local Test"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "📊 Step 1: Capture baseline health"
curl -s "$BASE_URL/api/health" | jq '.hcs22' > /tmp/health_before.json
echo "Baseline:"
cat /tmp/health_before.json
echo ""

# Wait for user to login manually
echo "📝 Step 2: Manual 3-Account Test"
echo ""
echo "${YELLOW}ACTION REQUIRED:${NC}"
echo "1. Open $BASE_URL in your browser"
echo "2. Login with 3 different email addresses"
echo "3. Check browser console for:"
echo "   - [HCS22] Identity resolved: {...}"
echo "   - [HCS22] Mapped did:ethr:0x... → 0.0.XXXXXX"
echo ""
read -p "Press ENTER when you've completed 3 logins..."
echo ""

# Check health after
echo "📊 Step 3: Check health after logins"
curl -s "$BASE_URL/api/health" | jq '.hcs22' > /tmp/health_after.json
echo "After:"
cat /tmp/health_after.json
echo ""

# Compare
echo "📈 Step 4: Compare metrics"
BEFORE_BINDINGS=$(jq '.bindings.total' /tmp/health_before.json)
AFTER_BINDINGS=$(jq '.bindings.total' /tmp/health_after.json)
BEFORE_RESOLVER=$(jq '.resolver.total' /tmp/health_before.json)
AFTER_RESOLVER=$(jq '.resolver.total' /tmp/health_after.json)

BINDINGS_DELTA=$((AFTER_BINDINGS - BEFORE_BINDINGS))
RESOLVER_DELTA=$((AFTER_RESOLVER - BEFORE_RESOLVER))

echo "Bindings: $BEFORE_BINDINGS → $AFTER_BINDINGS (Δ $BINDINGS_DELTA)"
echo "Resolver: $BEFORE_RESOLVER → $AFTER_RESOLVER (Δ $RESOLVER_DELTA)"
echo ""

# Validate
if [ "$BINDINGS_DELTA" -ge 1 ] && [ "$RESOLVER_DELTA" -ge 1 ]; then
  echo -e "${GREEN}✅ PASS:${NC} Health metrics incremented"
else
  echo -e "${RED}❌ FAIL:${NC} Health metrics did not increment"
  echo "Expected: bindings +3, resolver +3"
  echo "Got: bindings +$BINDINGS_DELTA, resolver +$RESOLVER_DELTA"
  exit 1
fi

# Check HCS topic
echo ""
echo "📋 Step 5: Check HCS topic for ASSERT events"
TOPIC_ID=$(grep HCS22_IDENTITY_TOPIC_ID .env.local | cut -d'=' -f2)
if [ -z "$TOPIC_ID" ]; then
  echo -e "${YELLOW}⚠️  WARNING:${NC} HCS22_IDENTITY_TOPIC_ID not set"
  echo "Skipping HCS topic check"
else
  echo "Topic ID: $TOPIC_ID"
  echo "Fetching last 5 messages..."
  curl -s "https://testnet.mirrornode.hedera.com/api/v1/topics/$TOPIC_ID/messages?limit=5&order=desc" \
    | jq '.messages[] | {seq: .sequence_number, timestamp: .consensus_timestamp, type: (.message | @base64d | fromjson? | .t)}' 2>/dev/null \
    || echo "Could not decode messages (check topic manually)"
  echo ""
fi

# Server logs check
echo "📝 Step 6: Check server logs"
echo "Look for [HCS22] lines in your dev server output"
echo "Expected patterns:"
echo "  - [HCS22 Resolver] Cache hit / Mirror hit"
echo "  - [HCS22] Published IDENTITY_ASSERT"
echo ""

# Summary
echo "================================"
echo -e "${GREEN}✅ T1 LOCAL TEST COMPLETE${NC}"
echo ""
echo "Next steps:"
echo "1. Review browser console logs"
echo "2. Check server logs for [HCS22] entries"
echo "3. Verify ASSERT events on Mirror Node"
echo "4. If all looks good, proceed to staging/production"
echo ""
echo "To disable HCS-22:"
echo "  sed -i 's/HCS22_ENABLED=true/HCS22_ENABLED=false/' .env.local"
echo "  # Restart server"
