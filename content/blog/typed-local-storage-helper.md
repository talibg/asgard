---
title: Typed Local Storage Helper
slug: typed-local-storage-helper
summary: A tiny, typed wrapper over localStorage with JSON-safe encoding, optional TTL, namespacing, and SSR guards for painless state persistence.
tags: [typescript, storage, localstorage, utilities]
publishedAt: 2025-10-31
language: ts
draft: false
---

```ts
type Serializer<T> = {
  encode(value: T): string
  decode(raw: string): T
}

type SetOptions = { ttl?: number }

type Listener<T> = (value: T | undefined) => void

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined'

function makeKey(prefix: string | undefined, key: string) {
  return prefix ? `${prefix}${key}` : key
}

function jsonSerializer<T>(): Serializer<T> {
  return {
    encode: (v) => JSON.stringify(v),
    decode: (s) => JSON.parse(s) as T
  }
}

type BoxRaw = { v: string; e?: number } 

export function createLocalKey<T>(key: string, opts?: {
  prefix?: string
  storage?: Storage
  serializer?: Serializer<T>
}): {
  get(defaultValue?: T): T | undefined
  set(value: T, options?: SetOptions): void
  remove(): void
  exists(): boolean
  subscribe(listener: Listener<T>): () => void
} {
  const storage = opts?.storage ?? (isBrowser ? localStorage : undefined)
  const ser = opts?.serializer ?? jsonSerializer<T>()
  const k = makeKey(opts?.prefix, key)

  function readRaw(): string | null {
    try { return storage?.getItem(k) ?? null } catch { return null }
  }

  function writeRaw(raw: string): void {
    try { storage?.setItem(k, raw) } catch {}
  }

  function removeRaw(): void {
    try { storage?.removeItem(k) } catch {}
  }

  function now() { return Date.now() }

  function get(defaultValue?: T): T | undefined {
    if (!storage) return defaultValue
    const raw = readRaw()
    if (raw == null) return defaultValue
    try {
      const box = JSON.parse(raw) as BoxRaw
      if (box.e && box.e <= now()) {
        removeRaw()
        return defaultValue
      }
      if (typeof box.v === 'string') {
        return ser.decode(box.v)
      }
      return defaultValue
    } catch {
      try {
        return ser.decode(raw)
      } catch {
        return defaultValue
      }
    }
  }

  function set(value: T, options?: SetOptions): void {
    if (!storage) return
    if (value === undefined) { remove(); return } 
    try {
      const encoded = ser.encode(value)
      const e = options?.ttl && options.ttl > 0 ? now() + options.ttl : undefined
      writeRaw(JSON.stringify({ v: encoded, e }))
      try { window.dispatchEvent(new CustomEvent(`localkey:${k}`)) } catch {}
    } catch {
      // swallow encode/quota errors
    }
  }

  function remove(): void {
    removeRaw()
    try { window.dispatchEvent(new CustomEvent(`localkey:${k}`)) } catch {}
  }

  function exists(): boolean {
    return get(undefined) !== undefined
  }

  function subscribe(listener: Listener<T>): () => void {
    if (!isBrowser || !storage) return () => {}
    const onChange = () => listener(get(undefined))
    const crossTab = (e: StorageEvent) => {
      if (e.storageArea === storage && e.key === k) onChange()
    }
    window.addEventListener('storage', crossTab)
    window.addEventListener(`localkey:${k}`, onChange as EventListener)
    onChange()
    return () => {
      window.removeEventListener('storage', crossTab)
      window.removeEventListener(`localkey:${k}`, onChange as EventListener)
    }
  }

  return { get, set, remove, exists, subscribe }
}

// Example usage
type Theme = 'light' | 'dark'
const theme = createLocalKey<Theme>('theme', { prefix: 'app:' })

// Set with a 7‑day TTL
theme.set('dark', { ttl: 7 * 24 * 60 * 60 * 1000 })

// Read with a default if missing/expired
console.log('theme:', theme.get('light'))

// React to changes from this or other tabs
const unsubscribe = theme.subscribe((value) => {
  console.log('theme changed:', value)
})

// Later: unsubscribe()
```

Local storage is a handy place for small, per‑user settings like theme, collapsed UI state, or last‑used filters—but raw `localStorage` calls are untyped, awkward to share across tabs, and easy to break with malformed JSON. This helper builds a tiny, typed abstraction around a single key so you can `get`, `set`, and `remove` values safely, with optional TTL and cross‑tab updates.

The API centers on `createLocalKey<T>(key, opts)`, which returns methods scoped to that key. Values are encoded as JSON in a small “box” shape `{ v, e? }`, where `e` is an absolute expiry in milliseconds. On `get()`, expired entries are deleted and treated as missing. The default serializer uses `JSON.stringify`/`JSON.parse`, but you can pass a custom `serializer` if you need a special format. Server‑side rendering is handled by a simple feature check: if `localStorage` isn’t available, reads return the default and writes become no‑ops—no crashes during SSR or tests. The `set` method accepts `null` when `T` permits it; with the default JSON serializer this is stored as the JSON literal `null` and round‑trips back to `null`. Passing `undefined` removes the key (by design) to avoid storing ambiguous empty boxes.

Two subtle bits improve ergonomics: a same‑tab CustomEvent so subscribers update immediately after `set()` or `remove()`, and a standard `storage` event listener so other tabs/windows stay in sync. Note: browsers do not fire cross‑tab storage events for `sessionStorage`; only same‑tab updates are covered via the CustomEvent, which this helper emits. The `subscribe` method wires both and immediately emits the current value, making it trivial to bind UI to storage without manual polling. All operations are wrapped in try/catch to avoid throwing on quota errors, private mode restrictions, or user‑cleared storage.

Use this helper when you want a tiny, dependency‑free layer with strong typing per key. It shines for booleans, enums, and small JSON blobs. Avoid it for sensitive data (localStorage is accessible to any script on the origin) or large objects (quota is limited and writes are synchronous). If you later need namespacing, pass a `prefix` like `app:` to keep related keys grouped, and consider a higher‑level wrapper that composes several `createLocalKey` instances for app‑wide settings.

