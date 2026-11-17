/** Next.js build and runtime configuration. Security headers are report-only in Step 1; static
 * export (Plan B, PRD §26.4) is selected only by `npm run build:static`. */

const isStaticExport = process.env.LIGHTPATH_STATIC_EXPORT === "1";

const securityHeaders = [
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self'",
      "object-src 'none'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(isStaticExport
    ? {
        distDir: ".next-static",
        output: "export",
        trailingSlash: true,
        cacheComponents: false,
        partialPrefetching: false,
        experimental: { agentFeedback: false },
      }
    : {
        experimental: { agentFeedback: true },
        cacheComponents: true,
        partialPrefetching: true,
        async headers() {
          return [{ source: "/(.*)", headers: securityHeaders }];
        },
      }),
};

export default nextConfig;
