---
title: Tiny AbortSignal Combiner (with Timeout)
slug: tiny-abort-signal-combiner
summary: Minimal utilities to merge multiple AbortSignals into one and add a timeout, preserving the original abort reason and avoiding leaks.
tags: [typescript, abortsignal, fetch, utilities]
publishedAt: 2025-11-01
language: ts
draft: false
---

```ts
const makeDomException = (message: string, name: string): Error => {
  try { return new DOMException(message, name) } catch { return Object.assign(new Error(message), { name }) }
}

export type AnySignal = {
  signal: AbortSignal
  dispose: () => void
}

export const anySignal = (...signals: Array<AbortSignal | undefined>): AnySignal => {
  const controller = new AbortController()
  const done = () => listeners.forEach(l => l())
  const abortWith = (reason?: unknown) => {
    if (!controller.signal.aborted) controller.abort(reason ?? makeDomException('Aborted', 'AbortError'))
    done()
  }

  const listeners: Array<() => void> = []

  for (const s of signals) {
    if (!s) continue
    if (s.aborted) {
      abortWith((s as unknown as { reason?: unknown }).reason)
      break
    }
    const onAbort = () => abortWith((s as unknown as { reason?: unknown }).reason)
    s.addEventListener('abort', onAbort, { once: true })
    listeners.push(() => s.removeEventListener('abort', onAbort))
  }

  return { signal: controller.signal, dispose: done }
}

export const timeoutSignal = (ms: number): AnySignal => {
  const controller = new AbortController()
  const id = setTimeout(() => {
    controller.abort(makeDomException('Timed out', 'TimeoutError'))
  }, Math.max(0, ms))
  const dispose = () => clearTimeout(id)
  return { signal: controller.signal, dispose }
}

// Example:
// Cancel fetch if either: the caller’s signal aborts OR we hit 8s timeout.
async function getJson(url: string, init?: RequestInit & { signal?: AbortSignal }) {
  const t = timeoutSignal(8000)
  const merged = anySignal(init?.signal, t.signal)
  try {
    const res = await fetch(url, { ...init, signal: merged.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  } finally {
    t.dispose()
    merged.dispose()
  }
}
```

Aborting requests is easier when you can treat “any of these signals” as a single signal. This tiny utility turns multiple `AbortSignal`s into one merged signal that aborts as soon as any input aborts. It also preserves the original abort reason, so downstream consumers can distinguish between a user cancellation (`AbortError`) and a timeout (`TimeoutError`). The companion `timeoutSignal(ms)` utility gives you a drop‑in signal that aborts after a specified duration and returns a `dispose()` to clear the timer.

`anySignal(...signals)` works in two steps. First, it handles already‑aborted inputs: if any provided signal is already aborted, it immediately aborts the merged controller with that signal’s `reason`. Second, it attaches one‑time `abort` listeners to each signal; on the first abort, it aborts the merged controller with the same `reason` and then calls `dispose()` to remove all listeners. Returning a `dispose` function prevents listener leaks when you’re done early or reuse the combiner across operations.

`timeoutSignal(ms)` clamps negative durations to `0` and aborts with a `DOMException('Timed out', 'TimeoutError')`. Pair it with `anySignal` to express common patterns like “cancel if the caller aborts or if we exceed 8 seconds.” The fetch example shows the typical lifecycle: construct signals, pass the merged signal to `fetch`, and unconditionally clean up in `finally` using both `dispose()` calls.

Notes and trade‑offs:
- Reason preservation: Modern browsers expose `AbortSignal.reason`; this code reads it defensively via a loose cast for compatibility. If no reason is present, a standard `AbortError` is used.
- Ultra‑portable errors: Some older Node runtimes lack a constructible `DOMException`. The helper uses `makeDomException()` to fall back to an `Error` with the `name` set, keeping types and messaging consistent.
- Native timeout: In very new environments, `AbortSignal.timeout(ms)` is a native alternative. `timeoutSignal(ms)` still earns its keep for compatibility and a unified API with `dispose()`.
- Zero signals: Calling `anySignal()` with no arguments returns a signal that never aborts—reasonable by design, but worth knowing.
- When to use: Great for layering concerns like caller‑initiated cancel, route changes, component unmounts, or timeouts without wiring custom plumbing. Prefer a single signal when possible; reach for `anySignal` when composition is clearer or unavoidable.
