import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getAllTags, getPostsByTag } from '@/lib/blog'

type Props = { params: Promise<{ tag: string }> }

export const dynamic = 'force-static'

export const generateStaticParams = () => getAllTags().map((tag) => ({ tag }))

export const generateMetadata = async ({ params }: Props) => {
    const { tag } = await params
    const decoded = decodeURIComponent(tag)
    return { title: `Tag: ${decoded}` }
}

export default async function TagPage({ params }: Props) {
    const { tag } = await params
    const decoded = decodeURIComponent(tag)
    const items = getPostsByTag(decoded)

    return (
        <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
            <h1 className="text-3xl font-semibold mb-2">
                Tag: <span className="font-mono">#{decoded}</span>
            </h1>
            <p className="text-muted-foreground mb-6">
                {items.length} blog post{items.length === 1 ? '' : 's'}
            </p>

            {items.length === 0 && (
                <p>
                    No blog posts for this tag yet.{' '}
                    <Link className="underline" href="/blog">
                        Back to Blog
                    </Link>
                </p>
            )}

            <ul className="space-y-4">
                {items.map((p) => (
                    <li className="border rounded-xl p-4 hover:shadow-sm bg-card" key={p.slug}>
                        <div className="flex items-start justify-between gap-3">
                            <Link className="text-xl font-semibold tracking-tight" href={`/blog/${p.slug}`}>
                                {p.title}
                            </Link>
                            <span className="text-xs text-muted-foreground shrink-0">
                                {new Date(p.publishedAt).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{p.summary}</p>
                        <div className="flex gap-2 flex-wrap mt-3">
                            {p.tags.map((t) => (
                                <Link href={`/tags/${encodeURIComponent(t)}`} key={t}>
                                    <Badge variant="outline">#{t}</Badge>
                                </Link>
                            ))}
                        </div>
                    </li>
                ))}
            </ul>
        </main>
    )
}
