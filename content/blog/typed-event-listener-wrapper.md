---
title: Typed Event Listener Wrapper
slug: typed-event-listener-wrapper
summary: A tiny utility to attach DOM listeners with precise event types and a tidy unsubscribe—no `as any` casts required.
tags: [typescript, dom, events, utilities]
publishedAt: 2025-10-29
language: ts
draft: false
---

```ts
type EventMapOf<T> =
  T extends Window ? WindowEventMap :
  T extends Document ? DocumentEventMap :
  HTMLElementEventMap

export const on = <
  T extends Window | Document | HTMLElement,
  K extends keyof EventMapOf<T>
>(
  el: T,
  type: K,
  handler: (e: EventMapOf<T>[K]) => void,
  options?: boolean | AddEventListenerOptions
) => {
  el.addEventListener(type as string, handler as EventListener, options)
  return () => el.removeEventListener(type as string, handler as EventListener, options)
}
```

Attaching DOM listeners often tempts us into `as any` casts when we want proper event typing—for example, ensuring `keydown` handlers see `KeyboardEvent` rather than `Event`. This micro‑utility makes that correctness the default. By constraining `K` to the keys of an event map derived from the target (Window/Document/HTMLElement), the `type` argument becomes a keyed union of valid listener names and the `handler` parameter narrows to the corresponding event type: pass `'click'`, get `MouseEvent`; pass `'keydown'`, get `KeyboardEvent`. No casts in user code, no guesswork.

Two practical benefits fall out of the generic signature. First, you get editor “jump to definition” for the right event fields (e.g., `e.key`, `e.clientX`) and instant feedback if you reference properties that don’t exist for that event. Second, consumers can’t mistype event names; TypeScript will flag `'keydwon'` immediately. Returning a teardown function standardizes cleanup: stash the return value and call it in component unmounts, effect disposers, or custom element `disconnectedCallback`s. Passing `options` to both `addEventListener` and `removeEventListener` preserves capture/passive/once symmetry so removal always matches exactly.

A couple of tips when adopting this pattern:
- Targets beyond elements. This helper supports `HTMLElement`, `Document`, and `Window` via `EventMapOf<T>`, making it universally handy.
- Keep the listener stable. Because the unsubscribe relies on the original `handler` reference, define handlers once (e.g., outside React effects or memoize them) to avoid dangling listeners.
- Consider capture and options. Use the `options` parameter for `{ capture: true }`, passive listeners, or `signal`—the helper threads it through add/remove symmetrically.

Why not just inline `addEventListener` calls? You certainly can, but sprinkling casts everywhere erodes type safety and readability. Centralizing the call in a tiny, typed helper cuts repetition and makes intent clear: “attach this listener and give me back a cleanup.” It’s the same shape used by popular frameworks and small enough to copy into any project without dependencies. If you want to extend it further, add AbortSignal support (`options: { signal }`), a `once` helper that auto‑unsubscribes, or refine `currentTarget` typing by intersecting the event with `{ currentTarget: T }`—the core idea stays the same: leverage the built‑in event maps so your handlers are always exactly typed.
