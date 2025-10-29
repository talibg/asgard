---
title: Create a Generic Repository Pattern in TypeScript with IndexedDB
slug: generic-repository-pattern-indexeddb-typescript
summary: A small, strongly‑typed repository wrapper over IndexedDB that gives you predictable CRUD, atomic batches, and clean separation of storage concerns.
tags: [typescript, indexeddb, patterns, storage]
publishedAt: 2025-10-29
language: ts
draft: false
---

```ts
type Key = IDBValidKey

type UpgradeHook = (store: IDBObjectStore, db: IDBDatabase) => void

function openDB(dbName: string, storeName: string, version = 1, onUpgrade?: UpgradeHook) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(dbName, version)

    req.onupgradeneeded = () => {
      const db = req.result
      const exists = db.objectStoreNames.contains(storeName)
      const tx = req.transaction
      const store = exists
        ? tx!.objectStore(storeName)
        : db.createObjectStore(storeName, { keyPath: 'id' })
      onUpgrade?.(store, db)
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => console.warn('IndexedDB upgrade blocked; close other tabs.')
  })
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

type Repo<T extends { id: Key }> = {
  get(id: Key): Promise<T | undefined>
  list(): Promise<T[]>
  count(): Promise<number>
  upsert(...items: T[]): Promise<void>
  remove(id: Key): Promise<void>
  clear(): Promise<void>
  close(): Promise<void>
}

type RepoConfig = {
  dbName: string
  storeName: string
  version?: number
  upgrade?: UpgradeHook
}

export function createRepository<T extends { id: Key }>(cfg: RepoConfig): Repo<T> {
  if (typeof indexedDB === 'undefined') throw new Error('IndexedDB not available in this environment')
  const { dbName, storeName, version = 1, upgrade } = cfg
  const dbp = openDB(dbName, storeName, version, upgrade)

  async function withStore<R>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => Promise<R> | R): Promise<R> {
    const db = await dbp
    return new Promise<R>((resolve, reject) => {
      const tx = db.transaction(storeName, mode)
      const store = tx.objectStore(storeName)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)

      ;(async () => {
        try {
          const resultPromise = Promise.resolve(fn(store))
          const completed = new Promise<void>((res) => (tx.oncomplete = () => res()))
          const result = await resultPromise
          await completed
          resolve(result)
        } catch (e) {
          try { tx.abort() } catch {}
          reject(e)
        }
      })()
    })
  }

  return {
    get(id) {
      return withStore('readonly', (s) => reqToPromise<T | undefined>(s.get(id)))
    },
    list() {
      return withStore('readonly', (s) => reqToPromise<T[]>(s.getAll()))
    },
    count() {
      return withStore('readonly', (s) => reqToPromise<number>(s.count()))
    },
    async upsert(...items: T[]) {
      await withStore('readwrite', (s) => {
        const promises = items.map((it) => reqToPromise(s.put(it)))
        return Promise.all(promises)
      })
    },
    remove(id) {
      return withStore('readwrite', (s) => reqToPromise<void>(s.delete(id)))
    },
    clear() {
      return withStore('readwrite', (s) => reqToPromise<void>(s.clear()))
    },
    close() {
      return dbp.then((db) => { db.close() })
    }
  }
}

// Example usage
type Todo = { id: number; title: string; done: boolean }
const todos = createRepository<Todo>({ dbName: 'app', storeName: 'todos', version: 1 })

;(async () => {
  await todos.upsert(
    { id: 1, title: 'Learn IndexedDB', done: false },
    { id: 2, title: 'Abstract with a Repo', done: false }
  )
  console.log('All:', await todos.list())
  console.log('Count:', await todos.count())
  console.log('One:', await todos.get(1))
  await todos.remove(2)
  console.log('After remove:', await todos.list())
  await todos.close()
})()
```

IndexedDB is powerful but awkward: you juggle versions, transactions, and event‑style APIs just to perform simple CRUD. A generic repository hides that complexity behind a small, predictable surface. The implementation above creates a typed `createRepository<T>()` around one object store (default keyPath `id`) and exposes `get`, `list`, `count`, `upsert`, `remove`, `clear`, and `close`. Each method runs inside a transaction so writes are atomic—`upsert(...items)` commits all or none—while reads remain simple and fast.

The core is `withStore()`, which opens a transaction, hands you the object store, waits for your work to finish, and only resolves once the transaction completes. This preserves durability: even if an operation’s request resolves, the promise doesn’t settle until IndexedDB actually commits. All request calls (`get`, `put`, `delete`, `clear`) are bridged to promises via `reqToPromise`, avoiding nested callbacks and making control flow linear and easy to test.

On first run or when you bump `version`, `onupgradeneeded` ensures the store exists and lets you add indexes through the optional `upgrade` hook. For example, you could call `store.createIndex('by_done', 'done')` without changing call sites. The generic constraint `T extends { id: IDBValidKey }` makes the key shape explicit; if your domain uses another key path, adjust the `createObjectStore` options and the `T` constraint accordingly. Batching in `upsert` is intentionally straightforward: looping with `await` keeps ordering deterministic and errors clear; for very large writes, you could launch requests without awaiting and still rely on the enclosing transaction to gate completion.

When to use this pattern: client‑side apps that need offline‑first storage, fast lookups, and a clean separation between persistence and features. When not to: server environments (IndexedDB isn’t available) or when you already depend on a high‑level wrapper like `idb`, which offers similar ergonomics. This repository aims for the sweet spot—tiny, typed, and purpose‑built—so your UI code can call `repo.upsert()` and move on.
