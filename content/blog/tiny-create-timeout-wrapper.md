---
title: Tiny Create Timeout Wrapper
slug: tiny-create-timeout-wrapper
summary: A typed wrapper for setTimeout that exposes cancel and refresh helpers so you can create predictable timers without leaks.
tags: [typescript, timers, utilities]
publishedAt: 2025-11-02
language: ts
draft: false
---

```ts
import { useEffect } from 'react'

export type Timeout = {
  id: ReturnType<typeof setTimeout>
  cancel: () => void
  refresh: (ms?: number) => void
}

export const createTimeout = (fn: () => void, ms: number): Timeout => {
  let id = setTimeout(fn, ms)
  const cancel = () => clearTimeout(id)
  const refresh = (next = ms) => {
    clearTimeout(id)
    id = setTimeout(fn, next)
  }
  return { id, cancel, refresh }
}

// Example:
const t = createTimeout(() => console.log('done!'), 2000)
t.refresh(4000)
t.cancel()

const doSomething = () => console.log('save draft')

// Clean up in component teardown:
useEffect(() => {
  const timeout = createTimeout(doSomething, 5000)
  return () => timeout.cancel()
}, [])
```

Timers seem simple until you need to reschedule or cancel them across component lifecycles, worker messages, or server timers. Ad hoc wrappers often leak handles or lose type information, especially once you branch between browser and Node environments. This helper keeps the API surface minimal—a single factory that returns a structured object—while **making the lifecycle explicit and impossible to forget.**

The `Timeout` type is the contract: whenever you create a timer you get back the raw `id` plus `cancel()` and `refresh()`. Because the union of DOM and Node timer IDs differs, `ReturnType<typeof setTimeout>` is the one safe way to describe it without losing IntelliSense in either runtime. Offering `cancel()` and `refresh()` as bound methods prevents the pattern where callers stash the ID in some wider-scoped variable and accidentally reuse a cleared handle later.

`createTimeout(fn, ms)` starts by scheduling the callback and capturing the handle locally. `cancel()` is nothing more than `clearTimeout(id)`, but making it a closure ensures it always references the latest ID. `refresh(next = ms)` first clears the current handle before scheduling a replacement, storing the new ID so future calls keep working; the default argument means “push the timer back by the original duration” with zero extra code from the caller.

The example shows three real-world moves: schedule work, nudge it later, then abort entirely. Because the helper owns the handle, you can tuck the returned object into React refs, Svelte stores, or service objects without reaching back into the global timer APIs. You also avoid subtle race conditions where a timer keeps firing because a stale ID remained in scope after you thought it died.

Reach for this when you need retry backoff, UI timeouts, or delayed cleanups that may be cancelled as state shifts. It remains intentionally tiny: no dependency on `AbortController`, no external scheduler to configure, just a pattern that composes well with existing code. If you ever need more advanced scheduling—like pausing/resuming or coalescing multiple callbacks—layer those behaviors on top while keeping this foundation intact for clear, type-safe timer control.
