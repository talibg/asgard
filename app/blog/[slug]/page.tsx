import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ProseHtml from '@/components/ui/prose-html'
import { getAllPostSlugs, getPostBySlug, getRelatedPostsByTags } from '@/lib/blog'

type Props = { params: Promise<{ slug: string }> }

export const generateStaticParams = () => getAllPostSlugs().map((slug) => ({ slug }))

export const generateMetadata = async ({ params }: Props) => {
    const { slug } = await params
    const { frontmatter } = await getPostBySlug(slug)
    return {
        title: frontmatter.title,
        description: frontmatter.summary,
        keywords: frontmatter.tags,
    }
}

export default async function PostPage({ params }: Props) {
    const { slug } = await params
    const { frontmatter, html } = await getPostBySlug(slug)
    const related = getRelatedPostsByTags(frontmatter.tags, frontmatter.slug, 5)

    return (
        <article className="max-w-4xl mx-auto px-4 py-12">
            <div className="mb-6">
                <Link className="text-sm text-muted-foreground hover:underline" href="/blog">
                    ← Back to Blog
                </Link>
            </div>
            <header className="mb-6">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{frontmatter.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-xs text-muted-foreground">
                        {new Date(frontmatter.publishedAt).toLocaleDateString()}
                    </span>
                    {frontmatter.tags.map((t) => (
                        <Link href={`/tags/${encodeURIComponent(t)}`} key={t}>
                            <Badge variant="outline">#{t}</Badge>
                        </Link>
                    ))}
                </div>
            </header>

            <ProseHtml html={html} />

            {/* CTA: encourage using the snippet manager */}
            <Card className="mt-10">
                <CardHeader className="flex items-start gap-3">
                    <div className="flex-1">
                        <CardTitle>Capture and organize your TypeScript snippets</CardTitle>
                        <CardDescription>
                            TypeSnip is a private, local snippet manager for TypeScript. Search, tag, and keep your code
                            handy.
                        </CardDescription>
                    </div>
                    <CardAction className="pt-1">
                        <Button asChild>
                            <Link href="/">Open Snippet Manager</Link>
                        </Button>
                    </CardAction>
                </CardHeader>
            </Card>

            {!!related.length && (
                <section className="mt-12">
                    <h2 className="text-2xl font-semibold mb-4">Related blog posts</h2>
                    <ul className="space-y-3">
                        {related.map((r) => (
                            <li className="border rounded-xl p-4 hover:shadow-sm bg-card" key={r.slug}>
                                <Link className="font-medium" href={`/blog/${r.slug}`}>
                                    {r.title}
                                </Link>
                                <p className="text-sm text-muted-foreground mt-1">{r.summary}</p>
                                <div className="flex gap-2 flex-wrap mt-3">
                                    {r.tags.map((t) => (
                                        <Link href={`/tags/${encodeURIComponent(t)}`} key={t}>
                                            <Badge variant="outline">#{t}</Badge>
                                        </Link>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <script
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'BlogPosting',
                        headline: frontmatter.title,
                        datePublished: frontmatter.publishedAt,
                        dateModified: frontmatter.updatedAt || frontmatter.publishedAt,
                        keywords: frontmatter.tags.join(' '),
                    }),
                }}
                type="application/ld+json"
            />
        </article>
    )
}
