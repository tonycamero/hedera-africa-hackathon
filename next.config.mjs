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
  experimental: {
    serverComponentsExternalPackages: ['@hashgraph/sdk', '@hashgraphonline/standards-sdk'],
  },
  webpack: (config, { isServer }) => {
    // Handle HCS-2 SDK React Native dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'react-native-quick-crypto': false,
      'react-native-zstd': false,
      'zstd-napi': false,
      'fs': false,
      'path': false,
      'crypto': false
    }

    // Ignore React Native modules in browser/server builds
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native-quick-crypto': false,
      'react-native-zstd': false,
      'zstd-napi': false
    }

    return config
  },
}

export default nextConfig
