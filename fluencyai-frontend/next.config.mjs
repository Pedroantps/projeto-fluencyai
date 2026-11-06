const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
const isDev = process.env.NODE_ENV !== 'production'

const csp = [
  "default-src 'self'",
  // Next.js precisa de inline scripts; apis.google.com serve o SDK de popup de login
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ''}https://apis.google.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.googleusercontent.com https://*.googleapis.com",
  "font-src 'self' data:",
  "media-src 'self' blob: data: https://actions.google.com",
  `connect-src 'self' ${apiUrl} https://*.googleapis.com https://*.firebaseapp.com https://accounts.google.com https://va.vercel-scripts.com https://vitals.vercel-insights.com`,
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://apis.google.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'microphone=(self)' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        ],
      },
    ]
  },
}

export default nextConfig
