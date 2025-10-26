import withPWA from 'next-pwa'

const isProd = process.env.NODE_ENV === 'production'

export default withPWA({
    dest: 'public',
    disable: !isProd,
    register: true,
    skipWaiting: true,
})({
    experimental: { serverActions: { allowedOrigins: [] } },
    turbopack: {},
})
