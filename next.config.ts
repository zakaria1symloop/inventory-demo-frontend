import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
];

// RFC 8288 Link headers for agent/LLM discovery: advertise the API catalog
// (RFC 9727) and the markdown LLM guide. Comma separates the two link values.
const agentDiscoveryLink = {
  key: 'Link',
  value:
    '</.well-known/api-catalog>; rel="api-catalog", </llms.txt>; rel="alternate"; type="text/markdown"; title="LLM guide"',
};

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  typescript: {
    // Pre-existing missing i18n keys render as the key string at runtime — non-blocking. Clean up later.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [...securityHeaders, agentDiscoveryLink],
      },
      {
        source: '/blog/:slug*',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:path*.(jpg|jpeg|png|gif|ico|svg|webp|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Canonical host is the apex (tracksera.com). The www → apex redirect
      // is handled by Vercel's domain config — don't redirect apex → www
      // here or you'll fight Vercel and loop.
      // Trailing slash cleanup
      {
        source: '/:path+/',
        destination: '/:path+',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
