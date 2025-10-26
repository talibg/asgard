import withPWA from 'next-pwa'

const isProd = process.env.NODE_ENV === 'production'

export default withPWA({
    dest: 'public',
    disable: !isProd,
    register: true,
    skipWaiting: true,
    fallbacks: {
        document: '/offline.html',
    },
    runtimeCaching: [
        // Cache Next.js build assets
        {
            urlPattern: /^https?.*\/_next\/static\/.*$/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'next-static',
                expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
        },
        // Optimized images
        {
            urlPattern: /^https?.*\/_next\/image\?url=.+$/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'next-image' },
        },
        // Google fonts & styles
        {
            urlPattern: /^https:\/\/(fonts\.gstatic\.com|fonts\.googleapis\.com)\/.*$/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 36, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
        },
        // Static assets from same-origin
        {
            urlPattern: /^https?.*\/(.*\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?))$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'static-resources',
                expiration: { maxEntries: 512, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
        },
        // HTML documents and route responses
        {
            urlPattern: /^https?.*$/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'html-docs',
                networkTimeoutSeconds: 10,
            },
        },
    ],
})({
    experimental: { serverActions: { allowedOrigins: [] } },
    turbopack: {},
})
