---
title: Type-Safe pick Helper
slug: type-safe-pick-helper-typescript
summary: Preserve exact key inference when slicing object shapes so you never lose type coverage while building derived views.
tags: [typescript, generics, utilities]
publishedAt: 2025-11-09
language: ts
draft: false
---

```ts
export function pick<
  T extends object,
  const K extends readonly (keyof T)[]
>(obj: T, keys: K): Pick<T, K[number]> {
  const out = {} as Pick<T, K[number]>
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      out[key] = obj[key]
    }
  }
  return out
}

type User = {
  id: string
  name: string
  email: string
  active: boolean
}

const user: User = {
  id: 'u1',
  name: 'Ava',
  email: 'ava@example.com',
  active: true
}

const summary = pick(user, ['id', 'name'])
// inferred as: { id: string; name: string }

const empty = pick(user, [])
// inferred as: {}

const a = ['x', 'y'] as const
const first = pick(a, [0] as const)
// inferred as: { 0: 'x' }

const secret = Symbol('secret')
const secured = pick({ id: 'u1', [secret]: 42 }, [secret] as const)
// inferred as: { [secret]: 42 }
```

Need to pluck a few keys from a large object without rewriting its entire type by hand? [TypeScript 5.0](https://www.typescriptlang.org/) finally gives us `const` generics, so this helper can keep IntelliSense honest instead of widening everything to `string`. By tying `K` to a `const` generic of `readonly (keyof T)[]` and returning `Pick<T, K[number]>`, the compiler proves at compile time that every requested key exists on the source object and that the resulting shape is precise for optional props, symbol keys, tuple indices, and even “no key” calls (because `Pick<T, never>` collapses to `{}` automatically).

The generic parameters split the responsibilities: `T` captures the incoming object type, and the `const K` constraint locks in the literal tuple so inline arrays of string literals no longer need `as const`. You still reach for `as const` when the key tuple holds numeric or symbol literals (e.g., `[0] as const`, `[secret] as const`) because those would otherwise widen to `number[]`/`symbol[]`, and any keys stored in a variable must be declared `const keys = ['id', 'name'] as const` to preserve their tuples. That preservation is what lets `Pick` compute the `{ id; name }` structure seen in the example—or `{ 0: 'x' }` when you pluck from `['x', 'y'] as const`—and because `Pick` mirrors optionality and `readonly`-ness you can safely grab nullable or immutable fields without widening them. If you already have those keys defined elsewhere (column lists, audit projections), passing the tuple directly keeps everything in sync, and calling `pick(user, [])` now just works with zero ceremony.

Runtime-wise the function stays boring on purpose: iterate over the provided key list, verify ownership with `Object.prototype.hasOwnProperty.call`, and assign onto a narrow `out` object. That guard matters for correctness (prototype pollution or inherited getters never sneak in), handles symbols and null-prototype objects by spec, and doubles as the reason tuple/array indices keep working—`hasOwnProperty` treats numeric keys as strings but still checks the right slot. The symbol example in the snippet shows the payoff: you can pluck `Symbol('secret')` fields without resorting to string casting, and because `out` is asserted once up front as `Pick<T, K[number]>`, the loop remains perfectly type-safe without `any` casts.

Use this helper when you reshape DTOs before sending them to the UI, build audit logs with only identifiers, or expose public profile data without leaking private fields. Skip it when you must support nested paths or remap key names—those cases call for a mapper that understands dot notation or a schema-driven transformer. Because the return type is entirely static, the optimized JS stays tree-shakable and dead simple, yet your IDE still tracks which fields survive the slice, catching omissions before they hit runtime. Requires TypeScript 5.0+ so the `const K` generic can preserve tuple literals without `as const`.
