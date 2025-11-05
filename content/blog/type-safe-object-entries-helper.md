---
title: Type-Safe Object.entries Helper
slug: type-safe-object-entries-helper
summary: Preserve key-value correlations from Object.entries so your loops stay perfectly typed without manual assertions.
tags: [typescript, utilities]
publishedAt: 2025-11-05
language: ts
draft: false
---

```ts
type StringKeys<T> = Extract<keyof T, string>

type Entries<T extends Record<string, unknown>> = {
  [K in StringKeys<T>]-?: [K, T[K]]
}[StringKeys<T>]

type StringRecord = Record<string, unknown>
type ReadonlyStringRecord = Readonly<Record<string, unknown>>

type PlainRecord<T> = T extends StringRecord | ReadonlyStringRecord
  ? T extends readonly unknown[]
    ? never
    : T
  : never

export const typedEntries = <T>(
  obj: PlainRecord<T>
): Entries<PlainRecord<T>>[] =>
  Object.entries(obj) as Entries<PlainRecord<T>>[]

type Flags = {
  search: true
  billing: false
  locale: 'en-US' | 'fr-FR'
}

const flags: Flags = {
  search: true,
  billing: false,
  locale: 'en-US',
}

for (const [key, value] of typedEntries(flags)) {
  if (key === 'locale') {
    value.toUpperCase()
  }
}
```

`Object.entries` is a convenient way to iterate through plain objects, but the moment you call it TypeScript forgets everything it knew about your keys and values. The runtime values are unchanged, yet the compiler now thinks each tuple is just `[string, any]`. That erases literal unions, allows typos to slip through, and often forces you to reach for unsafe assertions. A tiny wrapper restores the missing type information while still delegating to the built-in at runtime.

The helper starts with `StringKeys<T>`, which filters the key space down to the strings that `Object.entries` actually returns. Numeric literals are stringified by the engine, so the helper works best when you describe those members as string keys (for example, `type GridRow = Record<'0' | '1', Cell>`). Symbols never make it into the tuple list, so excluding them at the type level keeps things honest. The `-?` modifier strips optional flags so the union mirrors the keys that exist at runtime while still propagating `undefined` through the value type when a property is optional.

`PlainRecord<T>` gates the generic to plain data records that behave the way `Object.entries` expects—own, enumerable, string-indexed properties. That intentionally blocks arrays, tuples, and exotic objects with prototype baggage from slipping through, because their extra members (`length`, `map`, symbols) would otherwise appear in the type system even though `Object.entries` skips them. Numeric index signatures are also excluded; `Object.entries` converts them to strings, so model those keys as `'0'`, `'1'`, and so on (or implement a dedicated helper if you need true numeric support). Once those constraints are enforced, the implementation boils down to a single `Object.entries` call plus a cast, and every tuple in the returned array preserves the original key-to-value link.

In the example, the explicit `Flags` type keeps each tuple tied to its literal key while preserving unions on the values. Checking `key === 'locale'` therefore narrows the entry to `['locale', 'en-US' | 'fr-FR']`, letting TypeScript see `value` as the locale union instead of `any`. That keeps switch statements and lookup tables honest, because the compiler will force you to handle newly added flags whenever you widen the object. Reach for this helper when you own the record’s shape—configuration maps, manifest objects, strongly typed dictionaries—and fall back to schema validation or runtime checks when you’re dealing with untrusted payloads where enumerability and key types can’t be guaranteed.
