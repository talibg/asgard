---
title: Typed Event Emitter
slug: typed-event-emitter
summary: A generic EventEmitter that keeps listeners and payloads strongly typed all the way from emitters to subscribers.
tags: [typescript, events, utilities]
publishedAt: 2025-11-08
language: ts
draft: false
---

```ts
export type EventMap = Record<string, unknown>
export type Listener<T> = T extends void ? () => void : (payload: T) => void

export function createEmitter<Events extends EventMap>() {
  const listeners: { [K in keyof Events]?: Array<Listener<Events[K]>> } = {}

  const add = <K extends keyof Events>(event: K, fn: Listener<Events[K]>) => {
    ;(listeners[event] ||= []).push(fn)
    return () => remove(event, fn)
  }

  const on = <K extends keyof Events>(event: K, fn: Listener<Events[K]>) => add(event, fn)

  const remove = <K extends keyof Events>(event: K, fn: Listener<Events[K]>) => {
    const arr = listeners[event]
    if (!arr) return
    const i = arr.indexOf(fn)
    if (i >= 0) arr.splice(i, 1)
  }
  const off = remove
  const clearEvent = <K extends keyof Events>(event: K) => {
    if (listeners[event]) delete listeners[event]
  }

  const emit = <K extends keyof Events>(
    event: K,
    ...args: Events[K] extends void ? [] : [Events[K]]
  ) => {
    const snapshot = listeners[event]?.slice()
    if (!snapshot) return
    if (args.length === 0) {
      snapshot.forEach(fn => (fn as () => void)())
      return
    }
    const payload = args[0]
    snapshot.forEach(fn => (fn as (payload: Events[K]) => void)(payload))
  }

  const clear = () => {
    for (const k in listeners) delete listeners[k]
  }

  return { on, off, emit, clear, clearEvent }
}

// Example:
type AppEvents = {
  login: { userId: string }
  logout: void
}

const bus = createEmitter<AppEvents>()
const stopLog = bus.on('login', u => console.log('Logged in:', u.userId))
bus.on('logout', () => console.log('Logged out'))

bus.emit('login', { userId: '42' })
bus.emit('logout') // payload inferred as void; no arg needed
bus.clearEvent('login') // wipe every login listener at once
stopLog() // unsubscribe
```

Custom event buses drift toward `any` the moment you support more than one event, especially when payload shapes diverge. `createEmitter<Events>()` keeps everything inside a single generic map so every `emit` call and listener stays in sync. If the event map evolves, TypeScript surfaces the drift immediately—no forgotten payload properties, no stringly-typed mistakes.

The secret is the `EventMap` constraint (`Record<string, unknown>`) and the derived listener registry: `{ [K in keyof Events]?: Listener<Events[K]>[] }`. Each event key allocates an array dedicated to that payload type. `on(event, fn)` lazily creates the array, stores the callback, and returns a disposer so you can clean up from the caller’s side (e.g., React `useEffect` or a teardown routine). Because `Listener<T>` collapses `void` payloads to `() => void`, `logout`-style events feel as natural as structured ones while still enjoying narrow payload types.

`emit(event, payload)` makes strong typing pleasant to use by leaning on tuple inference. The rest parameter `...args` becomes `[]` for `void` events or `[Events[K]]` otherwise, so `args.length` tells us whether to call listeners with a payload or without one—no phantom `undefined` sneaking into zero-argument handlers. Before dispatching, the function snapshots the listener array (`slice()`) so removing listeners mid-flight—either by calling the disposer or `off` manually—won’t skip the next handler. The `off` helper removes a specific callback by reference, `clearEvent(event)` wipes a single topic, and `clear()` nukes everything when you need a hard reset (useful in tests or hot module replacement).

The sample shows two archetypal events: one structured (`login`) and one signal-style (`logout`). Listeners gain typed payloads (`u.userId` autocomplete) and the compiler enforces the correct `emit` signature. Returning a disposer lets you implement `once` by composing `on` and `off`, or schedule cleanups when features unmount. The map stays private inside the factory, so nobody can mutate another event’s listeners by mistake.

Where this shines: lightweight apps, background scripts, or shared packages that need an EventEmitter without pulling in Node’s implementation or losing types through `EventEmitter<string, any>`. Pair it with discriminated unions for richer payloads, or layer priorities and wildcard events if requirements grow. When you outgrow it, the migration path stays smooth because every call site already advertises the event map—swap the internals without rewriting consumer code.
