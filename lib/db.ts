import { type IDBPDatabase, openDB } from 'idb'

type Primitive = string | number | boolean | null | undefined
type KeyValue = string | number

export type IndexDef<T> = {
    name: string
    keyPath: Extract<keyof T, string> | ReadonlyArray<Extract<keyof T, string>>
    unique?: boolean
    multiEntry?: boolean
}

export type StoreConfig<T, KField extends Extract<keyof T, string>> = {
    dbName: string
    version: number
    storeName: string
    keyField: KField
    indexes?: ReadonlyArray<IndexDef<T>>
    textSearchFields?: ReadonlyArray<Extract<keyof T, string>>
}

export type OrderDir = 'asc' | 'desc'

type JsonExport<T> = {
    v: number
    exportedAt: number
    items: T[]
}

const dbCache = new Map<string, Promise<IDBPDatabase>>()

const getDbKey = (dbName: string, version: number) => `${dbName}@${version}`

const ensureDb = async <T>(cfg: StoreConfig<T, Extract<keyof T, string>>): Promise<IDBPDatabase> => {
    const cacheKey = getDbKey(cfg.dbName, cfg.version)
    if (!dbCache.has(cacheKey))
        dbCache.set(
            cacheKey,
            openDB(cfg.dbName, cfg.version, {
                upgrade(db, _oldVersion, _newVersion, tx) {
                    const hasStore = db.objectStoreNames.contains(cfg.storeName)
                    const store = hasStore
                        ? tx.objectStore(cfg.storeName)
                        : db.createObjectStore(cfg.storeName, { keyPath: cfg.keyField })
                    const existing = new Set<string>(Array.from(store.indexNames))
                    const indexes = cfg.indexes ?? []
                    for (const ix of indexes) {
                        if (!existing.has(ix.name)) {
                            const hasOpts = typeof ix.unique !== 'undefined' || typeof ix.multiEntry !== 'undefined'
                            if (hasOpts) {
                                store.createIndex(ix.name, ix.keyPath as unknown as string, {
                                    unique: Boolean(ix.unique),
                                    multiEntry: Boolean(ix.multiEntry),
                                })
                            } else {
                                store.createIndex(ix.name, ix.keyPath as unknown as string)
                            }
                        }
                    }
                },
            }),
        )
    const cached = dbCache.get(cacheKey)
    if (!cached) throw new Error(`DB cache miss for ${cacheKey}`)
    return cached
}

const makeChannelName = (dbName: string, storeName: string) => `${dbName}::${storeName}::changes`

const makeBroadcaster = (dbName: string, storeName: string) => {
    const supported = typeof BroadcastChannel !== 'undefined'
    const bc = supported ? new BroadcastChannel(makeChannelName(dbName, storeName)) : undefined
    const ping = () => bc?.postMessage({ t: 'changed' as const })
    const onChange = (fn: () => void): (() => void) | undefined => {
        if (!bc) return undefined
        const handler = (m: MessageEvent) => {
            const changed = typeof m.data === 'object' && m.data !== null && (m.data as { t?: unknown }).t === 'changed'
            if (changed) fn()
        }
        bc.addEventListener('message', handler)
        return () => bc.removeEventListener('message', handler)
    }
    return { ping, onChange }
}

const cmp = <T>(a: T, b: T): number => (a < b ? -1 : a > b ? 1 : 0)

const toLower = (v: unknown): string => (typeof v === 'string' ? v.toLowerCase() : String(v ?? '').toLowerCase())

export const createStore = <
    T extends Record<string, Primitive | Primitive[]>,
    KField extends Extract<keyof T, string>,
    K extends KeyValue = T[KField] extends KeyValue ? T[KField] : never,
>(
    cfg: StoreConfig<T, KField>,
) => {
    const { ping, onChange } = makeBroadcaster(cfg.dbName, cfg.storeName)

    const listAll = async (orderBy?: Extract<keyof T, string>, dir: OrderDir = 'desc'): Promise<T[]> => {
        const db = await ensureDb(cfg)
        const rows = (await db.getAll(cfg.storeName)) as T[]
        if (!orderBy) return rows
        const sorted = rows.slice().sort((a, b) => {
            const va = a[orderBy] as unknown as number
            const vb = b[orderBy] as unknown as number
            return dir === 'asc' ? cmp(va, vb) : cmp(vb, va)
        })
        return sorted
    }

    const clear = async (): Promise<void> => {
        const db = await ensureDb(cfg)
        await db.clear(cfg.storeName)
        ping()
    }

    const upsertMany = async (rows: T[]): Promise<void> => {
        const db = await ensureDb(cfg)
        const tx = db.transaction(cfg.storeName, 'readwrite')
        for (const r of rows) await tx.store.put(r)
        await tx.done
        ping()
    }

    const get = async (id: K): Promise<T | undefined> => {
        const db = await ensureDb(cfg)
        return db.get(cfg.storeName, id) as Promise<T | undefined>
    }

    const put = async (row: T): Promise<void> => {
        const db = await ensureDb(cfg)
        await db.put(cfg.storeName, row)
        ping()
    }

    const del = async (id: K): Promise<void> => {
        const db = await ensureDb(cfg)
        await db.delete(cfg.storeName, id)
        ping()
    }

    const exportJson = async (): Promise<string> => {
        const items = await listAll()
        const payload: JsonExport<T> = { v: 1, exportedAt: Date.now(), items }
        return JSON.stringify(payload, null, 2)
    }

    const importJson = async (json: string): Promise<void> => {
        const parsed = JSON.parse(json) as JsonExport<T>
        if (!Array.isArray(parsed.items)) throw new Error('Invalid import payload')
        await upsertMany(parsed.items)
    }

    const search = async (q: string): Promise<T[]> => {
        const query = q.trim()
        if (!query) return listAll()
        const db = await ensureDb(cfg)
        const rows = (await db.getAll(cfg.storeName)) as T[]
        const fields = cfg.textSearchFields ?? []
        const lower = query.toLowerCase()
        const matches = rows.filter((r) =>
            fields.some((f) => {
                const v = r[f]
                if (Array.isArray(v)) return v.some((x) => toLower(x).includes(lower))
                return toLower(v).includes(lower)
            }),
        )
        return matches
    }

    const listByIndex = async (indexName: string, query?: IDBKeyRange | KeyValue): Promise<T[]> => {
        const db = await ensureDb(cfg)
        const tx = db.transaction(cfg.storeName, 'readonly')
        const store = tx.store
        const index = store.index(indexName)
        if (typeof query === 'undefined') return index.getAll() as Promise<T[]>
        return index.getAll(query as never) as Promise<T[]>
    }

    return {
        listAll,
        clear,
        upsertMany,
        exportJson,
        importJson,
        get,
        put,
        delete: del,
        search,
        listByIndex,
        onChange,
    }
}
