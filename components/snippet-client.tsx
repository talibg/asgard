'use client'

import { ArrowDown10, ArrowDownAZ, ArrowUp10, ArrowUpAZ, Plus, SearchIcon } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import NewSnippetButton from '@/components/new-snippet-button'
import SnippetEditor from '@/components/snippet-editor'
import SnippetList from '@/components/snippet-list'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { onChange, type Snippet, Snippets } from '@/lib/snippets-store'

const uuid = () => crypto.randomUUID()

export default function SnippetClient() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [q, setQ] = useState('')
    const [items, setItems] = useState<Snippet[]>([])
    const [selectedId, setSelectedId] = useState<string | undefined>()
    const selected = useMemo(() => items.find((i) => i.id === selectedId), [items, selectedId])
    const [isMac, setIsMac] = useState<boolean>(false)
    const [sortKey, setSortKey] = useState<'updatedAt' | 'title'>('updatedAt')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
    const [_hasInteracted, setHasInteracted] = useState(false)
    // Track if user interacted so we can preserve selection behavior
    const _hadInitialParams = useMemo(() => {
        try {
            if (!searchParams) return false
            return Array.from(searchParams.entries()).length > 0
        } catch {
            return false
        }
    }, [searchParams])

    const sortItems = useCallback(
        (arr: Snippet[]): Snippet[] => {
            const copy = [...arr]
            if (sortKey === 'updatedAt') {
                copy.sort((a, b) => (sortDir === 'asc' ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt))
            } else {
                copy.sort((a, b) => {
                    const aa = (a.title || '').toLowerCase()
                    const bb = (b.title || '').toLowerCase()
                    if (aa < bb) return sortDir === 'asc' ? -1 : 1
                    if (aa > bb) return sortDir === 'asc' ? 1 : -1
                    return 0
                })
            }
            return copy
        },
        [sortKey, sortDir],
    )

    const load = useCallback(async () => {
        const qq = q.trim()
        const data = qq ? await Snippets.search(qq) : await Snippets.listAll()
        setItems(sortItems(data))
    }, [q, sortItems])

    const createEmpty = useCallback(async () => {
        const now = Date.now()
        const s: Snippet = {
            id: uuid(),
            title: 'Untitled snippet',
            code: '',
            tags: [],
            createdAt: now,
            updatedAt: now,
            language: 'ts',
        }
        await Snippets.put(s)
        setSelectedId(s.id)
        setHasInteracted(true)
        load()
        toast.success('Snippet created')
    }, [load])

    // Initialize from URL once on mount
    useEffect(() => {
        const spQ = searchParams?.get('q') ?? ''
        const spSort = (searchParams?.get('sort') as 'updatedAt' | 'title') ?? 'updatedAt'
        const spDir = (searchParams?.get('dir') as 'asc' | 'desc') ?? 'desc'
        const spId = searchParams?.get('id') ?? undefined
        setQ(spQ)
        setSortKey(spSort)
        setSortDir(spDir)
        setSelectedId(spId)
        // do not call load() here; debounced effect will fire with latest state
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams?.get])

    // Subscribe to cross-tab changes and create-snippet events
    useEffect(() => {
        const unsub = onChange(() => void load())
        const onCreate = () => {
            void createEmpty()
        }
        window.addEventListener('create-snippet', onCreate as EventListener)
        return () => {
            window.removeEventListener('create-snippet', onCreate as EventListener)
            unsub?.()
        }
    }, [createEmpty, load])

    useEffect(() => {
        // Detect platform for showing ⌘ vs Ctrl
        const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform)
        setIsMac(mac)
    }, [])

    useEffect(() => {
        const t = setTimeout(load, 120)
        return () => clearTimeout(t)
    }, [load])

    // Resort when sort options change without refetching
    useEffect(() => {
        setItems((prev) => sortItems(prev))
    }, [sortItems])

    // Push state to URL so it can be shared/bookmarked
    const syncUrl = useCallback(() => {
        const params = new URLSearchParams()
        if (q) params.set('q', q)
        if (sortKey !== 'updatedAt') params.set('sort', sortKey)
        if (sortDir !== 'desc') params.set('dir', sortDir)
        if (selectedId) params.set('id', selectedId)
        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname)
    }, [q, sortKey, sortDir, selectedId, router, pathname])

    useEffect(() => {
        const t = setTimeout(syncUrl, 200)
        return () => clearTimeout(t)
    }, [syncUrl])

    const searchRef = useRef<HTMLInputElement | null>(null)

    // Global shortcuts: Cmd/Ctrl+K focuses search, Cmd/Ctrl+N creates new
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!(e.metaKey || e.ctrlKey)) return
            const key = e.key.toLowerCase()
            if (key === 'k') {
                e.preventDefault()
                const el = searchRef.current
                if (el) {
                    el.focus()
                    el.select()
                }
            } else if (key === 'n') {
                // Use Meta/Ctrl + Alt + N to avoid browser new-window shortcut
                if (e.altKey) {
                    e.preventDefault()
                    window.dispatchEvent(new CustomEvent('create-snippet'))
                }
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [])

    const deleteSnippet = async (id: string) => {
        await Snippets.delete(id)
        if (selectedId === id) setSelectedId(undefined)
        setHasInteracted(true)
        await load()
        toast.error('Snippet deleted')
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-full min-h-0">
            <aside className="flex flex-col border rounded min-h-0">
                <div className="p-3">
                    <NewSnippetButton className="w-full mb-3" />
                    <div className="relative">
                        <Input
                            className="pr-20"
                            onChange={(e) => {
                                setQ(e.target.value)
                                setHasInteracted(true)
                            }}
                            placeholder="Search title, tags, or code"
                            ref={searchRef}
                            value={q}
                        />
                        <KbdGroup className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {isMac ? (
                                <>
                                    <Kbd>⌘</Kbd>
                                    <Kbd>K</Kbd>
                                </>
                            ) : (
                                <>
                                    <Kbd>Ctrl</Kbd>
                                    <Kbd>K</Kbd>
                                </>
                            )}
                        </KbdGroup>
                    </div>
                </div>
                <div className="px-3 pb-3">
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                        <Select
                            onValueChange={(v) => {
                                setSortKey(v as 'updatedAt' | 'title')
                                setHasInteracted(true)
                            }}
                            value={sortKey}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="updatedAt">Date</SelectItem>
                                <SelectItem value="title">Name</SelectItem>
                            </SelectContent>
                        </Select>
                        <button
                            aria-label={`Sort ${sortDir === 'asc' ? 'ascending' : 'descending'}`}
                            className="border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 inline-flex h-9 items-center gap-1 rounded-md border px-2 text-sm"
                            onClick={() => {
                                setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                                setHasInteracted(true)
                            }}
                            type="button"
                        >
                            {sortKey === 'title' ? (
                                sortDir === 'asc' ? (
                                    <ArrowUpAZ className="size-4" />
                                ) : (
                                    <ArrowDownAZ className="size-4" />
                                )
                            ) : sortDir === 'asc' ? (
                                <ArrowUp10 className="size-4" />
                            ) : (
                                <ArrowDown10 className="size-4" />
                            )}
                        </button>
                    </div>
                </div>
                <Separator />
                <div className="flex-1 min-h-0">
                    {items.length > 0 ? (
                        <ScrollArea className="h-full">
                            <SnippetList
                                items={items}
                                onDelete={deleteSnippet}
                                onSelect={(id) => {
                                    setSelectedId(id)
                                    setHasInteracted(true)
                                }}
                                selectedId={selectedId}
                            />
                        </ScrollArea>
                    ) : (
                        <Empty className="border-0">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <SearchIcon />
                                </EmptyMedia>
                                <EmptyTitle>No snippets</EmptyTitle>
                                <EmptyDescription>Create your first snippet to get started.</EmptyDescription>
                            </EmptyHeader>
                            <EmptyContent>
                                <Button onClick={() => window.dispatchEvent(new CustomEvent('create-snippet'))}>
                                    New Snippet
                                </Button>
                            </EmptyContent>
                        </Empty>
                    )}
                </div>
            </aside>

            <section className="border rounded p-3 min-h-0 overflow-hidden flex flex-col">
                {selected ? (
                    <SnippetEditor initial={selected} key={selected.id} onSaved={load} />
                ) : (
                    <Empty className="flex-1 border-0">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Plus />
                            </EmptyMedia>
                            <EmptyTitle>No snippet selected</EmptyTitle>
                            <EmptyDescription>Select an item from the list or create a new one.</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <NewSnippetButton label="Snippet" showShortcut size="sm" />
                        </EmptyContent>
                    </Empty>
                )}
            </section>
        </div>
    )
}
