import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getAllPostsMeta, getAllTags } from '@/lib/blog'

export const dynamic = 'force-static'

export const metadata = {
    title: 'Tags',
}

export default function TagsPage() {
    const tags = getAllTags()
    const meta = getAllPostsMeta()
    const counts = Object.fromEntries(tags.map((t) => [t, meta.filter((m) => m.tags.includes(t)).length])) as Record<
        string,
        number
    >
    return (
        <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
            <h1 className="text-3xl font-semibold mb-4">Tags</h1>
            <p className="text-muted-foreground mb-6">Browse blog posts by topic.</p>
            <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                    <Link href={`/tags/${encodeURIComponent(t)}`} key={t}>
                        <Badge variant="outline">
                            #{t} <span className="opacity-70 ml-1">({counts[t]})</span>
                        </Badge>
                    </Link>
                ))}
            </div>
        </main>
    )
}
