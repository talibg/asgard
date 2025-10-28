import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'

export type PostFrontmatter = z.infer<typeof Frontmatter>
export type PostMeta = {
    title: string
    slug: string
    summary: string
    tags: string[]
    publishedAt: string
    updatedAt?: string
    draft: boolean
    language: 'ts' | 'tsx' | 'js' | 'jsx' | 'bash'
}

export type Post = {
    frontmatter: PostFrontmatter
    slug: string
    html: string
    raw: string
}

// Accept both YAML-parsed Date and string, then normalize to string
const dateAsString = z
    .union([z.string(), z.date()])
    .transform((v) => (v instanceof Date ? v.toISOString().split('T')[0] : v))
    .pipe(z.string())

const Frontmatter = z.object({
    title: z.string().min(3),
    slug: z.string().min(1),
    summary: z.string().min(10),
    tags: z.array(z.string()).default([]),
    publishedAt: dateAsString,
    updatedAt: dateAsString.optional(),
    draft: z.boolean().default(false),
    language: z.enum(['ts', 'tsx', 'js', 'jsx', 'bash']).default('ts'),
})

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog')

export const getAllPostFiles = () => fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'))

export const getAllPostsMeta = (): PostMeta[] => {
    const files = getAllPostFiles()
    const items = files.map((file) => {
        const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8')
        const { data } = matter(raw)
        const fm = Frontmatter.parse(data)
        return {
            title: fm.title,
            slug: fm.slug,
            summary: fm.summary,
            tags: fm.tags,
            publishedAt: fm.publishedAt,
            ...(fm.updatedAt ? { updatedAt: fm.updatedAt } : {}),
            draft: fm.draft,
            language: fm.language,
        }
    })
    return items.filter((i) => !i.draft).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export const getAllTags = (): string[] => {
    const meta = getAllPostsMeta()
    return Array.from(new Set(meta.flatMap((m) => m.tags))).sort()
}

export const getPostsByTag = (tag: string): PostMeta[] => {
    const meta = getAllPostsMeta()
    return meta.filter((m) => m.tags.includes(tag))
}

export const getRelatedPostsByTags = (tags: string[], currentSlug: string, limit = 5): PostMeta[] => {
    const meta = getAllPostsMeta().filter((m) => m.slug !== currentSlug)
    const score = (m: PostMeta) => m.tags.filter((t) => tags.includes(t)).length
    return meta
        .map((m) => ({ m, s: score(m) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => {
            if (b.s !== a.s) return b.s - a.s
            return b.m.publishedAt.localeCompare(a.m.publishedAt)
        })
        .slice(0, limit)
        .map((x) => x.m)
}

export const getPostBySlug = async (slug: string) => {
    const filePath = path.join(CONTENT_DIR, `${slug}.md`)
    const raw = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(raw)
    const frontmatter = Frontmatter.parse(data)

    const { unified } = await import('unified')
    const remarkParse = (await import('remark-parse')).default
    const remarkGfm = (await import('remark-gfm')).default
    const toRehype = (await import('remark-rehype')).default
    const rehypeSlug = (await import('rehype-slug')).default
    const rehypeAutolink = (await import('rehype-autolink-headings')).default
    const rehypePrettyCode = (await import('rehype-pretty-code')).default
    const rehypeStringify = (await import('rehype-stringify')).default

    const html = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(toRehype)
        .use(rehypeSlug)
        .use(rehypeAutolink, { behavior: 'wrap' })
        // Use a dark Shiki theme and keep its background so code is dark in both light and dark UI themes
        .use(rehypePrettyCode, { theme: 'github-dark', keepBackground: true })
        .use(rehypeStringify)
        .process(content)
        .then((f) => String(f))

    return { frontmatter, slug, html, raw }
}

export const getAllPostSlugs = () => getAllPostFiles().map((f) => f.replace(/\.md$/, ''))
