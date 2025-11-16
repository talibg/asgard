---
title: How to Deep Clone in TypeScript Safely With a Fully Type-Safe Utility
slug: deep-clone-typescript-type-safe-utility
summary: Build a zero-dependency deep clone helper that preserves literal types while copying arrays, Maps, Sets, and Dates without mutating the source.
tags: [typescript, utilities]
publishedAt: 2025-11-16
language: ts
draft: false
---

```ts
type CloneableObject = Record<PropertyKey, unknown>

export function deepClone<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (typeof value !== 'object' || value === null) {
    return value
  }

  if (seen.has(value as object)) {
    return seen.get(value as object) as T
  }

  if (value instanceof Date) {
    return new Date(value) as T
  }

  if (value instanceof Map) {
    const cloned = new Map()
    seen.set(value as object, cloned)
    value.forEach((mapValue, key) => {
      cloned.set(deepClone(key, seen), deepClone(mapValue, seen))
    })
    return cloned as T
  }

  if (value instanceof Set) {
    const cloned = new Set<unknown>()
    seen.set(value as object, cloned)
    value.forEach(item => cloned.add(deepClone(item, seen)))
    return cloned as T
  }

  if (Array.isArray(value)) {
    const cloned = new Array(value.length)
    seen.set(value as object, cloned)
    for (let i = 0; i < value.length; i++) {
      if (i in value) {
        cloned[i] = deepClone(value[i], seen)
      }
    }
    return cloned as T
  }

  const cloned = Object.create(Object.getPrototypeOf(value) ?? Object.prototype)
  seen.set(value as object, cloned)

  for (const [key, nested] of Object.entries(value as CloneableObject)) {
    ;(cloned as CloneableObject)[key] = deepClone(nested, seen)
  }

  return cloned as T
}

const account = {
  plan: { name: 'Pro', limits: { seats: 3, team: new Set(['dev', 'design']) } },
  metadata: new Map([
    ['features', { status: 'beta' as const, rollout: new Date('2025-10-01') }],
  ]),
  tags: ['typescript', 'cloning'] as const,
}

const copy = deepClone(account)

copy.plan.limits.team.add('ops')
console.log(account.plan.limits.team.has('ops')) // false, source is untouched
```

Deep cloning complex state in TypeScript is usually a minefield: JSON-based hacks erase Dates and prototypes, `structuredClone` isn’t universally available yet and doesn’t always preserve custom class behaviour the way you might expect, and `lodash.cloneDeep` focuses on runtime flexibility rather than the compiler. This helper keeps literal and generic types intact by letting the compiler infer `T` from the value you pass in, so the clone tracks the exact shape you started with without annotations. It also avoids runtime surprises by supporting Maps, Sets, arrays, and plain objects out of the box.

The function starts by exiting early for primitives and nulls, then consults a `WeakMap` cache to break circular references before they blow up the call stack. Each specialized branch clones the correct data structure: Dates get copied via their timestamp, Maps clone both keys and values (object keys are also cloned, so the new map owns distinct identities), and Sets add their members one by one. Arrays are recreated with a length-matched loop that walks indices directly, so sparse slots remain sparse instead of being flattened away by a spread or JSON stringify.

Plain objects are recreated with `Object.create` so custom prototypes survive, something JSON and many helpers ignore. Only after the shell exists do we register it in the cache, ensuring nested references that point back to the parent receive the already-created instance instead of recursing forever. The object branch intentionally sticks to own enumerable string keys; symbol properties, getters/setters, and other descriptors are out of scope for this lightweight utility.

The usage example shows why preserving types matters: `copy.plan.limits.team` stays a `Set`, so calling `.add('ops')` compiles safely, and the original `account` remains untouched. This helper fits typical app state composed of objects, arrays, Maps, Sets, and Dates; functions are copied by reference and exotic built-ins like typed arrays, DOM nodes, or custom errors aren’t handled. Use it for deterministic snapshots, optimistic UI caches, or undo stacks, and reach for structural sharing or specialized libraries when cloning huge graphs or platform-specific objects.
