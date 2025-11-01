import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://typesnip.com'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/blog.meta.json', '/_next/', '/api/'],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    }
}
