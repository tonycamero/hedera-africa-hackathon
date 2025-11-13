#!/bin/bash

# TrustMesh Vercel Environment Setup Script
# This script adds/updates critical environment variables for production

echo "🚀 Setting up Vercel environment variables for production..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found!"
    echo "Please ensure .env.local exists with your configuration."
    exit 1
fi

echo "📋 Reading from .env.local..."
echo ""

# Function to add env var to Vercel
add_env_var() {
    local key=$1
    local value=$2
    local env=$3  # production, preview, or development
    
    if [ -z "$value" ]; then
        echo "⏭️  Skipping $key (empty value)"
        return
    fi
    
    echo "Adding $key to $env..."
    echo "$value" | vercel env add "$key" "$env" 2>&1 | grep -v "Overwrite" || true
}

# Critical variables that MUST be in production
echo "🔑 Setting critical authentication variables..."

# Magic.link
MAGIC_PUB=$(grep "NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=" .env.local | cut -d'=' -f2)
MAGIC_SECRET=$(grep "MAGIC_SECRET_KEY=" .env.local | cut -d'=' -f2)

echo "$MAGIC_PUB" | vercel env add NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY production
echo "$MAGIC_SECRET" | vercel env add MAGIC_SECRET_KEY production

echo ""
echo "🌐 Setting Hedera configuration..."

# Hedera config
HEDERA_NET=$(grep "^NEXT_PUBLIC_HEDERA_NETWORK=" .env.local | cut -d'=' -f2)
HEDERA_OP_ID=$(grep "^NEXT_PUBLIC_HEDERA_OPERATOR_ID=" .env.local | cut -d'=' -f2)
HEDERA_OP_KEY=$(grep "^NEXT_PUBLIC_HEDERA_OPERATOR_KEY=" .env.local | cut -d'=' -f2)

echo "$HEDERA_NET" | vercel env add NEXT_PUBLIC_HEDERA_NETWORK production
echo "$HEDERA_OP_ID" | vercel env add NEXT_PUBLIC_HEDERA_OPERATOR_ID production
echo "$HEDERA_OP_KEY" | vercel env add NEXT_PUBLIC_HEDERA_OPERATOR_KEY production

# Server-side Hedera vars
HEDERA_OP_ID_SERVER=$(grep "^HEDERA_OPERATOR_ID=" .env.local | cut -d'=' -f2)
HEDERA_OP_KEY_SERVER=$(grep "^HEDERA_OPERATOR_KEY=" .env.local | cut -d'=' -f2)

echo "$HEDERA_OP_ID_SERVER" | vercel env add HEDERA_OPERATOR_ID production
echo "$HEDERA_OP_KEY_SERVER" | vercel env add HEDERA_OPERATOR_KEY production
echo "testnet" | vercel env add HEDERA_NETWORK production

echo ""
echo "📡 Setting HCS Topics..."

# HCS Topics (client-side)
TOPIC_CONTACT=$(grep "^NEXT_PUBLIC_TOPIC_CONTACT=" .env.local | cut -d'=' -f2)
TOPIC_TRUST=$(grep "^NEXT_PUBLIC_TOPIC_TRUST=" .env.local | cut -d'=' -f2)
TOPIC_SIGNAL=$(grep "^NEXT_PUBLIC_TOPIC_SIGNAL=" .env.local | cut -d'=' -f2)
TOPIC_PROFILE=$(grep "^NEXT_PUBLIC_TOPIC_PROFILE=" .env.local | cut -d'=' -f2)

echo "$TOPIC_CONTACT" | vercel env add NEXT_PUBLIC_TOPIC_CONTACT production
echo "$TOPIC_TRUST" | vercel env add NEXT_PUBLIC_TOPIC_TRUST production
echo "$TOPIC_SIGNAL" | vercel env add NEXT_PUBLIC_TOPIC_SIGNAL production
echo "$TOPIC_PROFILE" | vercel env add NEXT_PUBLIC_TOPIC_PROFILE production

# HCS Topics (server-side)
echo "$TOPIC_CONTACT" | vercel env add TOPIC_CONTACT production
echo "$TOPIC_TRUST" | vercel env add TOPIC_TRUST production
echo "$TOPIC_SIGNAL" | vercel env add TOPIC_SIGNAL production
echo "$TOPIC_PROFILE" | vercel env add TOPIC_PROFILE production

echo ""
echo "🎯 Setting Feature Flags..."

# XMTP Configuration
echo "true" | vercel env add NEXT_PUBLIC_XMTP_ENABLED production
echo "dev" | vercel env add NEXT_PUBLIC_XMTP_ENV production

# HCS Configuration
echo "false" | vercel env add NEXT_PUBLIC_HCS_WS_ENABLED production
echo "5000" | vercel env add HCS_REST_POLL_INTERVAL production

# Other flags
echo "true" | vercel env add NEXT_PUBLIC_HCS_ENABLED production
echo "true" | vercel env add NEXT_PUBLIC_DEMO_MODE production

echo ""
echo "🔧 Setting additional configuration..."

# HCS22 / DID
HCS22_TOPIC=$(grep "^HCS22_IDENTITY_TOPIC_ID=" .env.local | cut -d'=' -f2)
HCS22_SALT=$(grep "^HCS22_DID_SALT=" .env.local | cut -d'=' -f2)

echo "true" | vercel env add HCS22_ENABLED production
echo "$HCS22_TOPIC" | vercel env add HCS22_IDENTITY_TOPIC_ID production
echo "$HCS22_SALT" | vercel env add HCS22_DID_SALT production
echo "1.0" | vercel env add HCS22_ASSERT_SAMPLING production
echo "info" | vercel env add HCS22_LOG_LEVEL production
echo "5" | vercel env add HCS22_REFRESH_INTERVAL_MINUTES production

# Token ID
TRST_TOKEN=$(grep "^NEXT_PUBLIC_TRST_TOKEN_ID=" .env.local | cut -d'=' -f2)
echo "$TRST_TOKEN" | vercel env add NEXT_PUBLIC_TRST_TOKEN_ID production

# Admin secret
ADMIN_SECRET=$(grep "^ADMIN_SEED_SECRET=" .env.local | cut -d'=' -f2)
echo "$ADMIN_SECRET" | vercel env add ADMIN_SEED_SECRET production

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "Next steps:"
echo "1. Review variables: vercel env ls"
echo "2. Deploy to production: vercel --prod"
echo "3. Check deployment: vercel ls"
