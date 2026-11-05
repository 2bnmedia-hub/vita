/** @type {import('next').NextConfig} */

// Baseline headers for every response. CSP here is deliberately limited to
// directives that cannot break Tranzila Hosted Fields / inline Next scripts
// (no script-src yet — a full script CSP needs nonces and a real payment test).
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
  // Full policy in REPORT-ONLY (5/11/2026): blocks nothing, only reports to /api/csp-report.
  // Promote to the enforced header after a clean report window AND a real Tranzila payment test.
  { key: 'Content-Security-Policy-Report-Only', value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://hf.tranzila.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://hf.tranzila.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://i.pravatar.cc https://images.unsplash.com",
    "media-src 'self' https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.tranzila.com https://fonts.googleapis.com https://fonts.gstatic.com",
    "frame-src 'self' https://*.tranzila.com",
    "form-action 'self' https://*.tranzila.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "report-uri /api/csp-report",
  ].join('; ') },
];

const nextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/(admin|api)/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'X-Robots-Tag', value: 'noindex' }] },
    ];
  },
};
module.exports = nextConfig;
