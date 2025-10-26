import { type IDBPDatabase, openDB } from 'idb'

export type SnippetId = string

export type Snippet = {
    id: SnippetId
    title: string
    code: string
    tags: string[]
    createdAt: number
    updatedAt: number
    language: 'ts' | 'tsx'
}

const DB_NAME = 'snippets-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | undefined

const getDb = () => {
    dbPromise ||= openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            const store = db.createObjectStore('snippets', { keyPath: 'id' })
            store.createIndex('by_title', 'title')
            store.createIndex('by_updatedAt', 'updatedAt')
            store.createIndex('by_tags', 'tags', { multiEntry: true })
        },
    })
    return dbPromise
}

const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('snippets') : undefined
const ping = () => bc?.postMessage({ t: 'changed' })
// Subscribe to cross-tab changes; returns an unsubscribe for cleanup
export const onChange = (fn: () => void): (() => void) | undefined => {
    if (!bc) return undefined
    const handler = (m: MessageEvent) => {
        // Only react to our change notifications
        const changed = typeof m.data === 'object' && m.data !== null && (m.data as { t?: unknown }).t === 'changed'
        if (changed) fn()
    }
    bc.addEventListener('message', handler)
    return () => bc.removeEventListener('message', handler)
}

export const Snippets = {
    listAll: async (): Promise<Snippet[]> => {
        const db = await getDb()
        const rows = await db.getAllFromIndex('snippets', 'by_updatedAt')
        return rows.reverse()
    },
    clear: async (): Promise<void> => {
        const db = await getDb()
        await db.clear('snippets')
        ping()
    },
    upsertMany: async (rows: Snippet[]): Promise<void> => {
        const db = await getDb()
        const tx = db.transaction('snippets', 'readwrite')
        for (const r of rows) await tx.store.put(r)
        await tx.done
        ping()
    },
    exportJson: async (): Promise<string> => {
        const items = await Snippets.listAll()
        const payload = { v: 1, exportedAt: Date.now(), items }
        return JSON.stringify(payload, null, 2)
    },
    // Full-text-ish search across title, tags, and code
    searchByTitle: async (q: string): Promise<Snippet[]> => {
        const query = q.trim()
        if (!query) return Snippets.listAll()
        const db = await getDb()
        const lower = query.toLowerCase()
        const rows = (await db.getAll('snippets')) as Snippet[]
        return rows
            .filter((r) => {
                const inTitle = r.title?.toLowerCase().includes(lower)
                const inTags = Array.isArray(r.tags) && r.tags.some((t: string) => t?.toLowerCase().includes(lower))
                const inCode = r.code?.toLowerCase().includes(lower)
                return Boolean(inTitle || inTags || inCode)
            })
            .sort((a, b) => b.updatedAt - a.updatedAt)
    },
    get: async (id: SnippetId): Promise<Snippet | undefined> => {
        const db = await getDb()
        return db.get('snippets', id)
    },
    put: async (row: Snippet): Promise<void> => {
        const db = await getDb()
        await db.put('snippets', row)
        ping()
    },
    delete: async (id: SnippetId): Promise<void> => {
        const db = await getDb()
        await db.delete('snippets', id)
        ping()
    },
}
