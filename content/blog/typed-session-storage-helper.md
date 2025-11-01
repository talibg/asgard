---
title: Typed Session Storage Helper
slug: typed-session-storage-helper
summary: A tiny, typed wrapper over sessionStorage with JSON-safe encoding, optional TTL, namespacing, SSR guards, and simple subscriptions for per‑tab state.
tags: [typescript, storage, sessionstorage, utilities]
publishedAt: 2025-11-01
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

const hasSession = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'

function makeKey(prefix: string | undefined, key: string, delimiter = '') {
  if (!prefix) return key
  if (!delimiter) return `${prefix}${key}`
  return prefix.endsWith(delimiter) ? `${prefix}${key}` : `${prefix}${delimiter}${key}`
}

function jsonSerializer<T>(): Serializer<T> {
  return {
    encode: (v) => JSON.stringify(v),
    decode: (s) => JSON.parse(s) as T
  }
}

type BoxRaw = { v: string; e?: number }

export type SessionKeyApi<T> = {
  get(defaultValue?: T): T | undefined
  set(value: Exclude<T, undefined>, options?: SetOptions): T
  remove(): void
  exists(): boolean
  touch(ttl: number): T | undefined
  subscribe(listener: Listener<T>): () => void
  subscribe(listener: Listener<T>, opts: { immediate?: boolean }): () => void
}

export function createSessionKey<T>(key: string, opts?: {
  prefix?: string
  keyDelimiter?: string
  storage?: Storage
  serializer?: Serializer<T>
}): SessionKeyApi<T> {
  const storage = opts?.storage ?? (hasSession ? sessionStorage : undefined)
  const ser = opts?.serializer ?? jsonSerializer<T>()
  const k = makeKey(opts?.prefix, key, opts?.keyDelimiter ?? ':')
  const evt = `sessionkey:${k}`

  const now = () => Date.now()

  function readRaw(): string | null {
    try { return storage?.getItem(k) ?? null } catch { return null }
  }
  function writeRaw(raw: string): void {
    try { storage?.setItem(k, raw) } catch {}
  }
  function removeRaw(): void {
    try { storage?.removeItem(k) } catch {}
  }

  function get(defaultValue?: T): T | undefined {
    if (!storage) return defaultValue
    const raw = readRaw()
    if (raw == null) return defaultValue
    try {
      const box = JSON.parse(raw) as BoxRaw
      if (box.e && box.e <= now()) { removeRaw(); return defaultValue }
      if (typeof box.v === 'string') return ser.decode(box.v)
      return defaultValue
    } catch {
      try { return ser.decode(raw) } catch { removeRaw(); return defaultValue }
    }
  }

  function set(value: Exclude<T, undefined>, options?: SetOptions): T {
    if (!storage) return value as T
    try {
      const encoded = ser.encode(value)
      const e = options?.ttl && options.ttl > 0 ? now() + options.ttl : undefined
      writeRaw(JSON.stringify({ v: encoded, e }))
      try { window.dispatchEvent(new CustomEvent(evt)) } catch {}
    } catch {
      // swallow encode/quota errors
    }
    return value as T
  }

  function remove(): void {
    removeRaw()
    try { window.dispatchEvent(new CustomEvent(evt)) } catch {}
  }

  function exists(): boolean {
    return get(undefined) !== undefined
  }

  function touch(ttl: number): T | undefined {
    const v = get(undefined)
    if (v === undefined) return undefined
    set(v as Exclude<T, undefined>, { ttl })
    return v
  }

  function subscribe(listener: Listener<T>, opts?: { immediate?: boolean }): () => void {
    if (!hasSession || !storage) return () => {}
    const onChange = () => listener(get(undefined))
    window.addEventListener(evt, onChange as EventListener)
    if (opts?.immediate ?? true) onChange()
    return () => {
      window.removeEventListener(evt, onChange as EventListener)
    }
  }

  return { get, set, remove, exists, touch, subscribe }
}

// Example usage
type Wizard = { step: number; data?: { email?: string } | null }
const wizard = createSessionKey<Wizard>('onboarding', { prefix: 'app:' })

// Start at step 1; set a 30‑minute TTL (absolute)
wizard.set({ step: 1, data: null }, { ttl: 30 * 60 * 1000 })

// To implement inactivity expiry, call touch() on user activity
// e.g., on route change, input, or click handlers
wizard.touch(30 * 60 * 1000)

// Read with a default if missing/expired
console.log('wizard:', wizard.get({ step: 0 }))

// React to changes within this tab
const unsubscribe = wizard.subscribe((value) => {
  console.log('wizard changed:', value)
})

// Later: unsubscribe()
```

Session storage is perfect for ephemeral, per‑tab UI state—think wizards, multi‑step forms, temporary filters, or draft inputs you don’t want to persist between reloads. But raw `sessionStorage` calls are untyped, easy to break with malformed JSON, and awkward to coordinate across a codebase. This helper creates a tiny, strongly typed abstraction around a single key so you can read, write, and clear values safely during a user’s session.

The API is `createSessionKey<T>(key, opts)` and returns a scoped set of methods: `get`, `set`, `remove`, `exists`, `touch`, and `subscribe`. Values are wrapped in a compact box `{ v, e? }` where `v` is the encoded payload and `e` is an absolute expiry timestamp. On `get()`, expired entries are treated as missing and removed to keep the storage clean. The default serializer uses JSON and round‑trips arbitrary types, including `null`; `set` rejects `undefined` at the type level via `Exclude<T, undefined>`—call `remove()` to delete. `set` returns the saved value to ease chaining, and `touch(ttl)` returns the current value (or `undefined` if absent). `subscribe` accepts an optional `{ immediate?: boolean }` (default `true`) to skip the initial emit when desired. You can swap in a custom `serializer` (e.g., to compress or encrypt) and a custom `storage` for testing. For convenience, an exported `SessionKeyApi<T>` type mirrors the returned API. If you prefer consistent key formatting even when callers omit delimiters in `prefix`, pass `keyDelimiter: ":"`.

This is SSR‑safe: when `window` or `sessionStorage` are unavailable, reads simply return the provided default and writes become no‑ops. Subscriptions are intentionally same‑tab only. Browsers do not propagate `sessionStorage` updates to other tabs or windows, so relying on the global `storage` event won’t help; the helper dispatches a lightweight CustomEvent (`sessionkey:<name>`) so your UI updates immediately after `set()` or `remove()` in the current tab. Quota/encode errors are swallowed by design to avoid user‑visible crashes. If a stored value is corrupt (e.g., `JSON.parse` fails and fallback decode also fails), the helper self‑heals by removing the bad entry. Note that `JSON.stringify` can throw on circular structures or `BigInt` values; the internal try/catch safely guards these cases. Prefer prefixes with a delimiter (e.g., `"app:"`) to avoid key collisions across features; the default `keyDelimiter` is `":"`. Calling `touch(0)` intentionally clears the expiry, making the value permanent for the life of the tab/session.

Use this when you need per‑tab, short‑lived state with strong typing and zero dependencies. It’s a great fit for transient flows and anything you want wiped on tab close. Avoid storing secrets (any script on the origin can read session storage) and keep payloads small—writes are synchronous and storage quotas are limited. If you later need persistence across tabs or reloads, reach for a sibling `localStorage` helper and a cross‑tab event strategy.
