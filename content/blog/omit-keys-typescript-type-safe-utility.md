---
title: How to Omit Keys in TypeScript (with a Type-Safe Utility)
slug: omit-keys-typescript-type-safe-utility
summary: Drop sensitive object fields safely by pairing a tiny omit helper with literal key inference and runtime filtering.
tags: [typescript, utilities]
publishedAt: 2025-11-15
language: ts
draft: false
---

```ts
type KeyArray<TObj extends object> = readonly (keyof TObj)[]

type OmitKeys<TObj extends object, TKeys extends KeyArray<TObj>> = Omit<TObj, TKeys[number]>

export function omitKeys<TObj extends object, TKeys extends KeyArray<TObj>>(
  obj: TObj,
  keys: TKeys,
): OmitKeys<TObj, TKeys> {
  const denyStrings = new Set<string>()
  const denySymbols = new Set<symbol>()

  for (const key of keys as readonly PropertyKey[]) {
    if (typeof key === 'symbol') {
      denySymbols.add(key)
      continue
    }
    denyStrings.add(String(key))
  }

  const result = {} as OmitKeys<TObj, TKeys>
  const source = obj as Record<PropertyKey, unknown>
  const target = result as Record<PropertyKey, unknown>

  for (const key of Object.keys(obj)) {
    if (denyStrings.has(key)) continue
    target[key] = source[key]
  }

  for (const sym of Object.getOwnPropertySymbols(obj)) {
    if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) continue
    if (denySymbols.has(sym)) continue
    target[sym] = source[sym]
  }

  return result
}

const config = {
  apiBase: 'https://api.service',
  retries: 2,
  secretKey: 'abc123',
  token: 'jwt',
}

const publicConfig = omitKeys(config, ['secretKey', 'token'] as const)
// type: { apiBase: string; retries: number }

const secret = Symbol('secret')

const palette = {
  0: '#fff',
  1: '#111',
  accent: '#f0f',
  [secret]: 'internal',
} as const

const trimmed = omitKeys(palette, ['1', secret] as const)
// type: { 0: '#fff'; accent: '#f0f' }
```

Most omit helpers lean solely on the structural `Omit<T, K>` type, but they leave the runtime call site to casts and trust. This version wires the compile-time and runtime halves together. The type parameter `TKeys` is tied to `readonly (keyof TObj)[]`, so passing `['secretKey', 'token'] as const` narrows the tuple literals and feeds them right into `Omit`. That instantly rejects typos: `omitKeys(config, ['tokne'])` produces a compiler error because `'tokne'` fails to extend `keyof typeof config`. At runtime the same tuple seeds a `Set`, giving `O(1)` lookups while keeping the slice logic tiny.

The loop now mirrors the way JavaScript treats property keys. Strings and numbers both end up in `denyStrings` because runtime property names are always stringified, while symbols live in `denySymbols`. `Object.keys` handles the enumerable string keys in insertion order, and `Object.getOwnPropertySymbols` adds the enumerable symbols afterward—the same order the spread operator would produce. A quick interop cast to `Record<PropertyKey, unknown>` lets the accumulator accept both shapes, but only after the type constraints have already ruled out illegal keys.

Because the deny-lists store numbers as strings, tuple indices and numeric record keys finally get removed at runtime instead of slipping through. Symbols are checked explicitly as well, so `omitKeys(palette, [secret])` really does strip secret metadata from the result. Non-enumerable members stay untouched, matching the behavior of object spreads, which keeps surprises to a minimum when you pass class instances or Date objects through the helper.

The examples illustrate both axes. With `config`, TypeScript infers `{ apiBase: string; retries: number }`, and the runtime version drops the two string keys instantly. With `palette`, omitting the key `'1'` (numeric-looking but still a string literal at the type level) plus the `secret` symbol yields `{ 0: '#fff'; accent: '#f0f' }`, so downstream theme logic never even sees the redacted slots. Optional properties, discriminated unions, and genuine `Record<number, T>` maps—which do accept numeric literals in `keyof`—all benefit from the same literal enforcement. When you truly need to omit arbitrary incoming keys, widen the second argument to `keyof T`—the return type widens in tandem, advertising that callers must handle more possibilities.

Use this helper any time you serialize, log, or share objects that mix human-friendly keys, numeric map positions, or symbol metadata. It keeps compile-time and runtime behavior in lockstep, avoids the churn of copying objects and deleting afterward, and remains a shallow utility that you can pair with deeper validation libraries when nested redaction becomes necessary.
