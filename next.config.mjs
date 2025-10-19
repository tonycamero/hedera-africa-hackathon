/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@hashgraph/sdk', '@hashgraphonline/standards-sdk'],
  webpack: (config, { isServer }) => {
    // Handle HCS-2 SDK React Native dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'react-native-quick-crypto': false,
      'react-native-zstd': false,
      'zstd-napi': false,
      'fs': false,
      'path': false,
      'crypto': false,
      'encoding': false,
      'bufferutil': false,
      'utf-8-validate': false
    }

    // Ignore React Native modules in browser/server builds
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native-quick-crypto': false,
      'react-native-zstd': false,
      'zstd-napi': false
    }

    // Disable legacy TrustMesh v2 ingestion when in Fairfield mode
    if (process.env.NEXT_PUBLIC_APP_MODE === "fairfield") {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/v2/events/eventBus': '@/lib/shims/noop',
        '@/lib/v2/demo/signal-orchestrator': '@/lib/shims/noop',
        '@/lib/v2/engine/universalRecognition': '@/lib/shims/noop',
        '@/lib/v2/store/ledgers': '@/lib/shims/noop',
        '@/lib/bootstrap/phaseFlags': '@/lib/shims/noop',
      };
    }

    return config
  },
}

export default nextConfig
