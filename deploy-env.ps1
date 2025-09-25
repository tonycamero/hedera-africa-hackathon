# Deploy CraftTrust Environment Variables to Vercel
Write-Host "🚀 Deploying CraftTrust environment variables to Vercel..."

# Core Hedera Configuration
vercel env add HEDERA_NETWORK production --value "testnet" --yes
vercel env add HEDERA_OPERATOR_ID production --value "0.0.5864857" --yes
vercel env add HEDERA_OPERATOR_KEY production --value "0x2394be44d8d169c79781083dce7038b7ca6a6318dd30fc5c082cf2417ab55c8a" --yes

# Public Hedera Variables
vercel env add NEXT_PUBLIC_HEDERA_NETWORK production --value "testnet" --yes
vercel env add NEXT_PUBLIC_HEDERA_OPERATOR_ID production --value "0.0.5864857" --yes
vercel env add NEXT_PUBLIC_HEDERA_OPERATOR_KEY production --value "0x2394be44d8d169c79781083dce7038b7ca6a6318dd30fc5c082cf2417ab55c8a" --yes

# CraftTrust TRST Token (252k minted!)
vercel env add NEXT_PUBLIC_TRST_TOKEN_ID production --value "0.0.5361653" --yes

# Magic.link Authentication
vercel env add MAGIC_PUBLISHABLE_KEY production --value "pk_live_EF6E977B049B499A" --yes
vercel env add MAGIC_SECRET_KEY production --value "sk_live_D6E19062C766B76D" --yes
vercel env add NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY production --value "pk_live_EF6E977B049B499A" --yes

# TrustMesh Features
vercel env add NEXT_PUBLIC_DEMO_MODE production --value "true" --yes
vercel env add NEXT_PUBLIC_HCS_ENABLED production --value "true" --yes
vercel env add NEXT_PUBLIC_TRUST_WORKFLOW_ENABLED production --value "true" --yes
vercel env add NEXT_PUBLIC_SESSION_CACHE_ENABLED production --value "true" --yes

# Mirror Node URLs
vercel env add NEXT_PUBLIC_MIRROR_NODE_URL production --value "https://testnet.mirrornode.hedera.com" --yes

Write-Host "✅ All CraftTrust environment variables deployed!"
Write-Host "🔄 Triggering production rebuild..."

# Trigger a new deployment with the environment variables
vercel --prod

Write-Host "🎉 CraftTrust x TrustMesh deployment complete!"