import fs from 'node:fs'
import path from 'node:path'
import type { MetadataRoute } from 'next'
import { getAllPostsMeta, getAllTags } from '@/lib/blog'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://typesnip.com'

const toDate = (iso?: string): Date => {
    if (!iso) return new Date()
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? new Date() : d
}

const fileMtime = (p: string): Date | undefined => {
    try {
        const st = fs.statSync(p)
        return st.mtime
    } catch {
        return undefined
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const posts = getAllPostsMeta()
    const newestPostMs = posts.length
        ? Math.max(...posts.map((p) => new Date(p.updatedAt || p.publishedAt).getTime()))
        : undefined
    const newestPostDate = newestPostMs ? new Date(newestPostMs) : undefined
    const appDir = path.join(process.cwd(), 'app')

    const staticEntries: MetadataRoute.Sitemap = [
        {
            url: `${siteUrl}/`,
            changeFrequency: 'weekly',
            priority: 1,
            lastModified: newestPostDate ?? fileMtime(path.join(appDir, 'page.tsx')),
        },
        {
            url: `${siteUrl}/about`,
            changeFrequency: 'monthly',
            priority: 0.6,
            lastModified: fileMtime(path.join(appDir, 'about', 'page.tsx')),
        },
        {
            url: `${siteUrl}/blog`,
            changeFrequency: 'weekly',
            priority: 0.9,
            lastModified: newestPostDate ?? fileMtime(path.join(appDir, 'blog', 'page.tsx')),
        },
        {
            url: `${siteUrl}/contact`,
            changeFrequency: 'monthly',
            priority: 0.3,
            lastModified: fileMtime(path.join(appDir, 'contact', 'page.tsx')),
        },
        {
            url: `${siteUrl}/privacy-policy`,
            changeFrequency: 'monthly',
            priority: 0.3,
            lastModified: fileMtime(path.join(appDir, 'privacy-policy', 'page.tsx')),
        },
        {
            url: `${siteUrl}/tags`,
            changeFrequency: 'weekly',
            priority: 0.6,
            lastModified: newestPostDate ?? fileMtime(path.join(appDir, 'tags', 'page.tsx')),
        },
        {
            url: `${siteUrl}/settings`,
            changeFrequency: 'monthly',
            priority: 0.3,
            lastModified: fileMtime(path.join(appDir, 'settings', 'page.tsx')),
        },
        {
            url: `${siteUrl}/terms`,
            changeFrequency: 'yearly',
            priority: 0.3,
            lastModified: fileMtime(path.join(appDir, 'terms', 'page.tsx')),
        },
    ]

    const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
        url: `${siteUrl}/blog/${p.slug}`,
        lastModified: toDate(p.updatedAt || p.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.8,
    }))

    const tags = getAllTags()
    const tagEntries: MetadataRoute.Sitemap = tags.map((tag) => {
        const tagged = posts.filter((p) => p.tags.includes(tag))
        const latest = tagged
            .map((p) => toDate(p.updatedAt || p.publishedAt).getTime())
            .reduce((a, b) => Math.max(a, b), 0)
        return {
            url: `${siteUrl}/tags/${encodeURIComponent(tag)}`,
            lastModified: latest ? new Date(latest) : undefined,
            changeFrequency: 'weekly',
            priority: 0.5,
        }
    })

    return [...staticEntries, ...postEntries, ...tagEntries]
}
