'use client'

import Fuse from 'fuse.js'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

type Meta = {
    title: string
    slug: string
    summary: string
    tags: string[]
    publishedAt: string
}

const fetchMeta = async (): Promise<Meta[]> => {
    const res = await fetch('/blog.meta.json', { cache: 'no-store' })
    return res.json()
}

const unique = <T,>(arr: T[]) => Array.from(new Set(arr))

export function BlogClient() {
    const [items, setItems] = useState<Meta[]>([])
    const [q, setQ] = useState('')
    const [activeTags, setActiveTags] = useState<string[]>([])
    const [loaded, setLoaded] = useState(false)
    const router = useRouter()
    const params = useSearchParams()
    const pageParam = Number(params.get('page') || '1')
    const [page, setPage] = useState<number>(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1)

    useEffect(() => {
        let mounted = true
        fetchMeta()
            .then((data) => {
                if (mounted) setItems(data)
            })
            .finally(() => mounted && setLoaded(true))
        return () => {
            mounted = false
        }
    }, [])

    const tags = useMemo(() => unique(items.flatMap((i) => i.tags)).sort(), [items])

    const fuse = useMemo(
        () =>
            new Fuse(items, {
                keys: ['title', 'summary', 'tags'],
                threshold: 0.35,
                ignoreLocation: true,
            }),
        [items],
    )

    const filtered = useMemo(() => {
        const base = q ? fuse.search(q).map((r) => r.item) : items
        if (!activeTags.length) return base
        return base.filter((i) => activeTags.every((t) => i.tags.includes(t)))
    }, [q, items, activeTags, fuse])

    const pageSize = 10
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const currentPage = Math.min(page, totalPages)
    const paged = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filtered.slice(start, start + pageSize)
    }, [filtered, currentPage])

    useEffect(() => {
        const sp = new URLSearchParams(params?.toString())
        if (currentPage > 1) sp.set('page', String(currentPage))
        else sp.delete('page')
        router.replace(`/blog${sp.size ? `?${sp.toString()}` : ''}`)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, params?.toString, router.replace])

    const toggleTag = (t: string) => {
        setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
        setPage(1)
    }

    useEffect(() => {
        setPage(1)
    }, [])

    return (
        <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
            <header className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
                <p className="text-muted-foreground mt-2">Bite-sized notes and snippets on TypeScript and tooling.</p>
            </header>

            <div className="flex items-center gap-3 mb-6">
                {loaded ? (
                    <Input
                        className="h-11"
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search blog posts, tags, keywords..."
                        value={q}
                    />
                ) : (
                    <Skeleton className="h-11 w-full" />
                )}
            </div>

            {loaded ? (
                <div className="flex flex-wrap gap-2 mb-8">
                    {tags.map((t) => {
                        const active = activeTags.includes(t)
                        return (
                            <button
                                aria-pressed={active}
                                className="focus:outline-none"
                                key={t}
                                onClick={() => toggleTag(t)}
                                type="button"
                            >
                                <Badge variant={active ? 'default' : 'outline'}>#{t}</Badge>
                            </button>
                        )
                    })}
                </div>
            ) : (
                <div className="flex flex-wrap gap-2 mb-8">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton className="h-6 w-16 rounded-full" key={i} />
                    ))}
                </div>
            )}

            {loaded ? (
                <>
                    <ul className="grid gap-4">
                        {paged.map((p) => (
                            <li
                                className="group border rounded-xl p-5 hover:shadow-sm transition-colors bg-card"
                                key={p.slug}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <Link
                                        className="text-xl font-semibold tracking-tight flex-1 min-w-0"
                                        href={`/blog/${p.slug}`}
                                    >
                                        {p.title}
                                    </Link>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                        {new Date(p.publishedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">{p.summary}</p>
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

                    {totalPages > 1 && (
                        <nav aria-label="Pagination" className="flex items-center justify-between gap-3 mt-8">
                            <Button
                                aria-label="Previous page"
                                disabled={currentPage <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                size="sm"
                                type="button"
                                variant="outline"
                            >
                                Prev
                            </Button>
                            <ul className="flex items-center gap-1">
                                {Array.from({ length: totalPages }).map((_, i) => {
                                    const n = i + 1
                                    const active = n === currentPage
                                    return (
                                        <li key={n}>
                                            <Button
                                                aria-current={active ? 'page' : undefined}
                                                aria-label={`Page ${n}`}
                                                onClick={() => setPage(n)}
                                                size="sm"
                                                type="button"
                                                variant={active ? 'default' : 'outline'}
                                            >
                                                {n}
                                            </Button>
                                        </li>
                                    )
                                })}
                            </ul>
                            <Button
                                aria-label="Next page"
                                disabled={currentPage >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                size="sm"
                                type="button"
                                variant="outline"
                            >
                                Next
                            </Button>
                        </nav>
                    )}
                </>
            ) : (
                <ul className="grid gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <li className="border rounded-xl p-5 bg-card" key={i}>
                            <div className="flex items-start justify-between gap-3">
                                <Skeleton className="h-6 flex-1" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                            <div className="mt-3 space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-4/5" />
                            </div>
                            <div className="flex gap-2 flex-wrap mt-3">
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <Skeleton className="h-6 w-14 rounded-full" key={j} />
                                ))}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    )
}
