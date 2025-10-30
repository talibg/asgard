---
title: Tiny TypeScript Sleep Function
slug: typescript-sleep-function
summary: A minimal `sleep(ms)` Promise utility for readable async pauses without blocking the event loop.
tags: [typescript, utilities, async, timers]
publishedAt: 2025-10-30
language: ts
draft: false
---

```ts
export const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms))

// Example usage
async function demo() {
  console.log('start')
  await sleep(300)
  console.log('after 300ms')
}
demo()
```

Sometimes you just need a small pause between async steps: wait for an animation to finish, stagger API calls, or throttle a loop without blocking the thread. This tiny `sleep(ms)` does exactly that. It returns a `Promise<void>` that resolves after the specified delay, letting you `await` in any async function while keeping the event loop free for UI updates, I/O, and other tasks.

Under the hood it wraps `setTimeout` in a `Promise`. Because we don’t store the timeout ID, there’s nothing to clean up—once the timer fires, the promise resolves and the micro-task queue continues. The return type is explicit (`Promise<void>`) to keep call sites simple and avoid leaking unnecessary values. Using it is straightforward: call `await sleep(300)` wherever a brief, intentional pause improves clarity or coordination.

This approach is preferable to busy-waiting (e.g., loops that spin until `Date.now()` advances) because JavaScript is single-threaded in most environments; blocking the thread freezes your app. With `sleep`, control yields back to the runtime so rendering stays smooth and other work proceeds. A few timing realities to keep in mind: browsers clamp nested/rapid timers to a minimum (~4ms) and background tabs may clamp to much higher values (often 1000ms). Timers are not precise scheduling primitives—treat delays as “at least” the requested duration.

Common patterns where `sleep` shines:
- Staggered retries with backoff: `await sleep(base * 2 ** attempt)`.
- Gentle polling while awaiting a condition.
- Demo/test flows that need deterministic gaps without mocking timers.
- Sequencing UI effects where a small delay reads clearer than callbacks.

Trade-offs and extensions: since we don’t keep the timeout ID, you can’t cancel mid-sleep. If cancellation matters, accept an `AbortSignal` and clear the timeout on `abort`, rejecting the promise. In Node.js you might also consider `setTimeout(...).unref()` for sleeps that shouldn’t keep the process alive. For next-tick deferrals where you want to yield immediately, use `await Promise.resolve()` or `queueMicrotask` instead of a 0ms timeout.

Use `sleep` sparingly and for intent, not as a band-aid for race conditions. When a delay encodes domain logic (“wait 300ms after the last keystroke”), it can make code more readable; when it papers over missing lifecycle hooks or event signals, reaching for a proper event or state check is usually the better fix.

