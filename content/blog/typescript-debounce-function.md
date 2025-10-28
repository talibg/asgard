---
title: TypeScript Debounce Function
slug: typescript-debounce-function
summary: A tiny, typed debounce utility that delays execution until input settles and includes cancel/flush helpers.
tags: [typescript, utilities, performance]
publishedAt: 2025-10-27
language: ts
draft: false
---

```ts
type Debounced<TArgs extends unknown[], TThis> =
  ((this: TThis, ...args: TArgs) => void) & {
    cancel: () => void
    flush: () => void
  }

export function debounce<TArgs extends unknown[], TThis = unknown>(
  fn: (this: TThis, ...args: TArgs) => void,
  delay = 300
): Debounced<TArgs, TThis> {
  let id: ReturnType<typeof setTimeout> | null = null
  let lastArgs: TArgs | null = null
  let lastThis: TThis | null = null

  const invoke = () => {
    if (!lastArgs) return
    try {
      fn.apply(lastThis as TThis, lastArgs)
    } finally {
      lastArgs = null
      lastThis = null
    }
  }

  const debounced = (function (this: TThis, ...args: TArgs) {
    lastArgs = args
    lastThis = this
    if (id) clearTimeout(id)
    id = setTimeout(() => {
      id = null
      invoke()
    }, delay)
  }) as Debounced<TArgs, TThis>

  debounced.cancel = () => {
    if (id) clearTimeout(id)
    id = null
    lastArgs = null
    lastThis = null
  }

  debounced.flush = () => {
    if (id) {
      clearTimeout(id)
      id = null
    }
    if (lastArgs) invoke()
  }

  return debounced
}

// Example: debounce a plain function
const search = (q: string) => console.log('fetch', q)
const debouncedSearch = debounce(search, 300)
debouncedSearch('rea')
debouncedSearch('react') // only "react" triggers after 300ms

// Example: debounce an object method (this preserved, strictly typed)
type Store = {
  query: string
  setQuery(this: Store, q: string): void
  setQueryDebounced: (this: Store, q: string) => void
}
const store = { query: '', setQuery(this: Store, q: string) { this.query = q } } as Store
store.setQueryDebounced = debounce<Parameters<Store['setQuery']>, Store>(store.setQuery, 250)
store.setQueryDebounced('hello') // inside setQuery, this === store
```

Debouncing keeps interfaces snappy during bursts of events. Typing into a search bar or dragging a slider can trigger dozens of handlers per second. If each call does heavy work—filtering, fetching, recalculating layouts—UIs stutter. Debounce waits for a pause: each call resets a timer; only when no more arrive within the delay do you run. That matches the mental model of “do this after I stop.”

The utility above is strongly typed and preserves the call‑site `this`, making it safe for object methods. It captures `this` at invocation and uses `fn.apply` inside an `invoke` helper. It also exposes `cancel` (clear any pending run) and `flush` (invoke immediately if args are pending). After a scheduled call executes, the pending args are cleared, so a later `flush()` is a no‑op. A `try/finally` ensures references clear even if `fn` throws, preventing leaks.

Choosing a delay depends on the interaction. For typing, 250–400 ms is a good default; for gestures, shorten it to keep the UI responsive. In React, avoid stale closures: either include `fn`/`delay` in deps when memoizing, or keep `fn` in a ref and read `ref.current` inside the runner. Pair debouncing with lightweight feedback so the interface stays responsive while heavy work waits. Optional extras (kept out here to stay minimal): leading edge, maxWait, or `flush()` returning the last result when you widen the return type.
