---
title: Throttle Function in TypeScript
slug: typescript-throttle-function
summary: A tiny, typed throttle utility with leading/trailing options plus cancel/flush helpers.
tags: [typescript, utilities, performance]
publishedAt: 2025-10-30
language: ts
draft: false
---

```ts
type Throttled<TArgs extends unknown[], TThis> =
  ((this: TThis, ...args: TArgs) => void) & {
    cancel: () => void
    flush: () => void
  }

type ThrottleOptions = {
  leading?: boolean
  trailing?: boolean
}

export function throttle<TArgs extends unknown[], TThis = unknown>(
  fn: (this: TThis, ...args: TArgs) => void,
  wait = 100,
  { leading = true, trailing = true }: ThrottleOptions = {}
): Throttled<TArgs, TThis> {
  if (leading === false && trailing === false) {
    throw new Error('throttle: leading and trailing cannot both be false')
  }
  const interval = Math.max(0, wait)
  const timeNow = () => (typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now())
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastInvoke = 0
  let lastArgs: TArgs | null = null
  let lastThis: TThis | null = null

  const invoke = (time: number) => {
    if (!lastArgs) return
    lastInvoke = time
    try {
      fn.apply(lastThis as TThis, lastArgs)
    } finally {
      lastArgs = null
      lastThis = null
    }
  }

  const startTimer = (ms: number) => {
    timer = setTimeout(() => {
      timer = null
      if (trailing && lastArgs) {
        invoke(timeNow())
      }
    }, ms)
  }

  const throttled = (function (this: TThis, ...args: TArgs) {
    const now = timeNow()
    if (!lastInvoke && leading === false) {
      lastInvoke = now
    }

    const remaining = interval - (now - lastInvoke)
    lastArgs = args
    lastThis = this

    if (remaining <= 0 || remaining > interval) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      if (leading) {
        invoke(now)
      } else if (trailing) {
        startTimer(interval)
      }
    } else if (!timer && trailing) {
      startTimer(remaining)
    }
  }) as Throttled<TArgs, TThis>

  throttled.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    lastArgs = null
    lastThis = null
    lastInvoke = 0
  }

  throttled.flush = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (lastArgs) {
      invoke(timeNow())
    }
  }

  return throttled
}

// Example: throttle a scroll handler
const onScroll = throttle(() => console.log('scroll tick'), 200)
window.addEventListener('scroll', onScroll)

// Example: throttle an object method (this preserved)
type Store = {
  count: number
  inc(this: Store, by: number): void
  incThrottled: (this: Store, by: number) => void
}
const store = { count: 0, inc(this: Store, by: number) { this.count += by } } as Store
store.incThrottled = throttle<Parameters<Store['inc']>, Store>(store.inc, 250)
store.incThrottled(1)
```

Throttling ensures a function runs at most once per time window, which is perfect for high‑frequency events like `scroll`, `resize`, or `pointermove`. Where debouncing waits for silence, throttling allows a steady cadence—useful when you want updates during continuous activity without overwhelming your app. The utility above is strongly typed, preserves `this`, and includes `cancel` and `flush` helpers so you can control pending work precisely.

How it works: each call records the latest arguments and context. If enough time has passed since the last invocation (`remaining <= 0`), it runs immediately (the “leading” edge). Otherwise, it schedules a run for the end of the current window (the “trailing” edge) if requested. Disabling `leading` defers the first call until the trailing edge—handy when you only want work after some sustained input. `flush()` forces the pending call to run now; `cancel()` clears timers and drops buffered args.

Practical tips and trade‑offs:
- Choose `wait` to match UX expectations. For scroll/layout work, 100–200 ms is common; for pointer moves, tighten it.
- Leading vs trailing. Enabling both gives a responsive first update and a final one; disable one edge to fit your needs.
 - Task timing. `setTimeout` runs on the macrotask queue and is subject to timer clamping (foreground floors ≈4ms; background tabs can clamp much higher). Treat `wait` as a minimum, not a guarantee.
- In React or similar, keep the handler reference stable or wrap with `useMemo`/`useRef` to avoid resubscribing and to ensure `cancel/flush` map to the correct instance.

Use throttling when you need periodic feedback during continuous activity. Prefer debouncing when only the final state matters (e.g., auto‑save after typing). With a tiny, typed helper like this, you can drop it into any codebase and tune `leading`/`trailing` to match the interaction.

Edge cases and extensions:
- Impossible configuration. If `leading === false` and `trailing === false`, this implementation throws to avoid a “never call” setup.
- Minimum wait. `wait` is clamped to `>= 0` to avoid negative timeouts.
- Monotonic timing. Uses `performance.now()` with a `Date.now()` fallback for stable cadence; store an initial offset if you need compatibility with wall‑clock timestamps.
- Max wait (optional). Add a `maxWait` option to guarantee an invoke after a ceiling window even with continuous calls—easy to layer without changing defaults.
- Last result (optional). Capture `fn`’s return value in `invoke` and have `flush()` return it if you want to surface results.
