---
title: Type-Safe hasOwnProperty Helper
slug: type-safe-hasownproperty-helper
summary: Guard against stray prototype keys with a typed helper that narrows arbitrary property lookups the way TypeScript expects.
tags: [typescript, type-guards, utilities]
publishedAt: 2025-11-03
language: ts
draft: false
---

```ts
export const hasOwn = <T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): key is Extract<K, keyof T> =>
  Object.prototype.hasOwnProperty.call(obj, key)

type FeatureFlags = {
  search: boolean
  billing: boolean
}

const flags: FeatureFlags = { search: true, billing: false }

const readFlag = (flag: string) => {
  if (!hasOwn(flags, flag)) {
    return false
  }
  return flags[flag]
}

const searchEnabled = readFlag('search') // boolean
const metricsEnabled = readFlag('metrics') // false
```

Whenever you accept untyped data—maybe a feature flag payload or query params—you eventually need to ask if a key is safe to read. The usual `key in obj` fallback reports true for inherited properties as well, even when the value happens to be `undefined`, so you risk pulling prototype pollution into your logic. This helper keeps the check honest by narrowing only the keys that truly belong to your target object.

`hasOwn` is generic over both the object (`T`) and the key (`K`), and the return type `key is Extract<K, keyof T>` is the heart of the trick. `Extract` filters whatever key you pass down to the subset that is actually assignable to `keyof T`, so inside the guarded branch the key becomes a precise literal union. That means `flags[flag]` in the example below is safe because the key has been narrowed to `'search' | 'billing'`, not the wider `string`. The call to `Object.prototype.hasOwnProperty.call` is the battle-tested runtime check that ignores prototype pollution even if someone redefines `obj.hasOwnProperty`.

In the snippet, a `FeatureFlags` object exposes only two switches, yet callers can still hand `readFlag` any string. The guard blocks unknown values early, returning the fallback `false`, while known keys flow through with their actual boolean type. This keeps consumers honest without forcing them to cast or juggle overloads when they are spelunking through dynamic inputs.

TypeScript has grown friendlier APIs like `Object.hasOwn`, but wrapping the logic like this gives you a first-class type guard you can share across Node, workers, and browsers without worrying about `lib` targets. Type guards must refine to a subtype of the original variable, so a blunt `key is keyof T` often fails: if `K` is `'search' | 'admin'` while `keyof T` is `'search' | 'billing'`, that guard would be invalid because `'search' | 'billing'` is not assignable to `'search' | 'admin'`. `Extract<K, keyof T>` always produces a type that is assignable to `K`, yielding `'search'` in that example. When there is no overlap it intentionally resolves to `never`, which correctly tells TypeScript the guarded branch cannot run. If you pair this with stricter object types or `satisfies`, you can even let consumers supply literal tuples of keys and have every element properly narrowed.

Reach for this helper whenever you read from dictionaries sourced from JSON, query strings, or third-party SDK responses. It gives you a single choke point for rejecting polluted keys while letting TypeScript prove at compile time that subsequent property access is safe. Skip it only when you explicitly need prototype access or you are fine working with `any` and giving up the extra safety net.
