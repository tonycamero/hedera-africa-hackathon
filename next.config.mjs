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
  async headers() {
    return [
      {
        source: '/collections/:path*',
        headers: [{ key: 'x-robots-tag', value: 'noindex' }],
      },
      {
        source: '/signals-trading',
        headers: [{ key: 'x-robots-tag', value: 'noindex' }],
      },
    ]
  },
  serverExternalPackages: [
    '@hashgraph/sdk',
    '@hashgraphonline/standards-sdk',
    '@xmtp/browser-sdk',
    '@xmtp/wasm-bindings'
  ],
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

    // XMTP browser-sdk: Enable WASM and async WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true
    }

    // XMTP browser-sdk: Completely exclude from server bundle (prevent require() errors)
    if (isServer) {
      // Use externals as a function to fully skip XMTP modules on server
      const originalExternals = config.externals || []
      config.externals = [
        ...originalExternals,
        // Mark XMTP packages as external for server bundles
        ({ request }, callback) => {
          if (
            request === '@xmtp/browser-sdk' ||
            request === '@xmtp/wasm-bindings' ||
            request?.startsWith('@xmtp/browser-sdk/') ||
            request?.startsWith('@xmtp/wasm-bindings/')
          ) {
            return callback(null, `commonjs ${request}`)
          }
          callback()
        }
      ]
    }

    return config
  },
}

export default nextConfig
