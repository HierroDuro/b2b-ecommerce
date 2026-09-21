import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 * These harden the app against common web vulnerabilities:
 * - Clickjacking (X-Frame-Options / frame-ancestors)
 * - MIME sniffing (X-Content-Type-Options)
 * - XSS via inline script injection (Content-Security-Policy)
 * - Referrer leakage (Referrer-Policy)
 * - Unwanted browser feature access (Permissions-Policy)
 */
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    // microphone=(self) allows the chat's voice-message recorder
    // (getUserMedia) to prompt for mic access; camera/geolocation stay
    // fully disabled since nothing in the app uses them.
    value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js needs 'unsafe-inline' for its hydration bootstrap script and
      // 'unsafe-eval' only in development (fast refresh). Tightened via NODE_ENV check.
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      // blob: needed for the chat's voice-message preview: it plays from a
      // local blob: URL (via <audio>, governed by media-src) and decodes it
      // into a waveform (via fetch, governed by connect-src) before it's
      // ever uploaded — without both, the recording plays back silently or
      // not at all.
      "media-src 'self' blob:",
      "connect-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Server Actions already restrict allowed origins; this list covers
  // local development plus the deployment domain (set via env at build time).
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", process.env.NEXT_PUBLIC_APP_DOMAIN].filter(
        (v): v is string => Boolean(v),
      ),
    },
  },
  images: {
    // Local placeholder product images live under /public/placeholders.
    // Add real remote hosts here if product images are later served from a CDN.
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
  },
  // Files uploaded after boot aren't in Next's static file list — route
  // /uploads/* through a handler that reads them from disk (see
  // src/app/api/files). beforeFiles so it wins over the public/ lookup.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/uploads/:path*", destination: "/api/files/:path*" }],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
