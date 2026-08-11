/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ofx-js is published as pure ESM. next/jest derives its
  // transformIgnorePatterns from this list, so it also lets Jest load it.
  transpilePackages: ['ofx-js'],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
  experimental: {
    optimizePackageImports: ['@chakra-ui/react'],
  },
}

export default nextConfig
