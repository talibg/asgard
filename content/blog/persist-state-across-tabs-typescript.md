---
title: Persist State Across Tabs in TypeScript
slug: persist-state-across-tabs-typescript
summary: A tiny, typed helper that persists state in storage and syncs changes across tabs using BroadcastChannel with a safe localStorage fallback.
tags: [typescript, storage, broadcastchannel, localstorage]
publishedAt: 2025-10-31
language: ts
draft: false
---

```ts
type Serializer<T> = {
  encode(value: T): string
  decode(raw: string): T
}

type Listener<T> = (value: T | undefined) => void

const isBrowser = typeof window !== 'undefined'

function jsonSerializer<T>(): Serializer<T> {
  return {
    encode: (v) => JSON.stringify(v),
    decode: (s) => JSON.parse(s) as T
  }
}

export function createTabState<T>(key: string, opts?: {
  prefix?: string
  storage?: Storage
  serializer?: Serializer<T>
}) {
  const ser = opts?.serializer ?? jsonSerializer<T>()
  const k = opts?.prefix ? `${opts.prefix}${key}` : key
  const storage = opts?.storage ?? (isBrowser ? localStorage : undefined)
  const hasBC = isBrowser && 'BroadcastChannel' in window
  const channel = hasBC ? new BroadcastChannel(`tabstate:${k}`) : undefined

  const listeners = new Set<Listener<T>>()
  let wired = false

  function read(): T | undefined {
    if (!storage) return undefined
    try {
      const raw = storage.getItem(k)
      if (raw == null) return undefined
      return ser.decode(raw)
    } catch {
      return undefined
    }
  }

  function writeEncoded(encoded: string | null) {
    if (!storage) return
    try {
      if (encoded === null) storage.removeItem(k)
      else storage.setItem(k, encoded)
    } catch {
      // swallow quota/errors
    }
  }

  function notify(value: T | undefined) {
    listeners.forEach((fn) => {
      try { fn(value) } catch {}
    })
  }

  function wire() {
    if (wired || !isBrowser) return
    wired = true
    const onStorage = (e: StorageEvent) => {
      if (!storage) return
      if (e.storageArea === storage && e.key === k) {
        try {
          const v = e.newValue == null ? undefined : ser.decode(e.newValue)
          notify(v)
        } catch {
          notify(undefined)
        }
      }
    }
    window.addEventListener('storage', onStorage)

    if (channel) {
      channel.onmessage = (ev: MessageEvent) => {
        const msg = ev.data as { v?: string; rm?: boolean }
        if (msg?.rm) { notify(undefined); return }
        if (typeof msg?.v === 'string') {
          try { notify(ser.decode(msg.v)) } catch { notify(undefined) }
        }
      }
    }
  }

  function get(defaultValue?: T): T | undefined {
    const v = read()
    return v === undefined ? defaultValue : v
  }

  function set(value: T): void {
    if (!isBrowser) return
    wire()
    if (value === undefined) {
      writeEncoded(null)
      try { channel?.postMessage({ rm: true }) } catch {}
      notify(undefined)
      return
    }
    try {
      const encoded = ser.encode(value)
      writeEncoded(encoded)
      try { channel?.postMessage({ v: encoded }) } catch {}
      notify(value)
    } catch {
      // swallow encode/quota errors
    }
  }

  function remove(): void {
    set(undefined as unknown as T)
  }

  function subscribe(listener: Listener<T>): () => void {
    wire()
    listeners.add(listener)
    listener(read())
    return () => {
      listeners.delete(listener)
    }
  }

  function close(): void {
    try { channel?.close() } catch {}
  }

  return { get, set, remove, subscribe, close }
}

// Example
// In every tab: keep a shared cart count in sync
const cart = createTabState<number>('cart:count', { prefix: 'app:' })

cart.subscribe((n) => {
  console.log('cart updated to', n)
})

// Somewhere in UI
function addToCart() {
  const current = cart.get(0) ?? 0
  cart.set(current + 1)
}
```

Keeping UI state in sync across tabs is a common need—think carts, auth flags, or feature toggles. Browsers give you the pieces, but the ergonomics vary: `BroadcastChannel` is great when available, while `localStorage`’s `storage` event works broadly but only fires in other tabs (not the one doing the write). This helper composes both into a tiny, typed utility you can drop into any app: state is persisted in storage and updates broadcast to all open tabs.

How it works: `createTabState<T>(key, opts)` returns `get`, `set`, `remove`, `subscribe`, and `close`. Values are serialized with a pluggable `serializer` (JSON by default). When you call `set(value)`, the helper encodes the value, writes it to `storage`, and sends a `BroadcastChannel` message if supported; both paths are wrapped in `try/catch` so encoding errors (e.g., cyclic objects) or quota exceptions don’t crash your app. Other tabs receive the update through the channel or the `storage` event and notify subscribers. The current tab’s subscribers are also notified immediately, so your UI updates without waiting on events.

A few practical notes:
- Broadcast support: `BroadcastChannel` is widely supported in evergreen browsers; the fallback to `storage` events covers older ones. Remember `sessionStorage` does not fire cross‑tab events; prefer `localStorage` for multi‑tab sync.
- SSR safety: all operations are guarded by runtime checks; on the server, methods no‑op and `get()` returns the default.
- Types: the helper is fully generic—`T` can be primitives or JSON‑serializable objects. `null` round‑trips with the default serializer; passing `undefined` removes the key by design.
- Consistency: calling `subscribe` immediately emits the current value from storage, making it trivial to bind UI state.

Use this when you need lightweight, dependency‑free cross‑tab state with persistence. For more complex coordination (locks, presence, or large payloads), consider higher‑level protocols over `BroadcastChannel` or a service worker message bus; the core pattern here still applies.

