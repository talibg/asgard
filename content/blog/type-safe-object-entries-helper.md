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
type NoNumberKeys<T> = Extract<keyof T, number> extends never ? T : never
type NoArrays<T> = T extends readonly unknown[] ? never : T

type Entries<T extends object> = {
  [K in StringKeys<T>]-?: [K, T[K]]
}[StringKeys<T>]

export const typedEntries = <T extends object>(
  obj: T & NoArrays<NoNumberKeys<T>>
): Entries<T>[] =>
  Object.entries(obj as Record<string, unknown>) as Entries<T>[]

type Flags = {
  search: true
  billing: false
  locale: 'en-US' | 'fr-FR'
}

const flags: Flags = {
  search: true,
  billing: false,
  locale: 'en-US'
}

for (const [key, value] of typedEntries(flags)) {
  if (key === 'locale') {
    value.toUpperCase()
  }
}
```

`Object.entries` is a convenient way to iterate through plain objects, but the moment you call it TypeScript forgets everything it knew about your keys and values. The runtime values are unchanged, yet the compiler now thinks each tuple is just `[string, any]`. That erases literal unions, allows typos to slip through, and often forces you to reach for unsafe assertions. A tiny wrapper restores the missing type information while still delegating to the built-in at runtime. This helper intentionally rejects arrays and objects with numeric keys because `Object.entries` stringifies them to `'123'`, which no longer indexes the original numeric slot without extra plumbing.

The helper starts with `StringKeys<T>`, which filters the key space down to the strings that `Object.entries` actually returns. `NoNumberKeys<T>` guards the input so any object with real numeric keys fails to compile, and `NoArrays<T>` blocks arrays and tuples, which expose indexed signatures that don’t align with the helper’s promises. Symbols never make it into the tuple list, so excluding them at the type level keeps things honest. The `-?` modifier strips optional flags so the union mirrors the keys that exist at runtime while still propagating `undefined` through the value type when a property is optional.

With those constraints in place, the implementation boils down to one `Object.entries` call and a cast to `Entries<T>[]`. Because the generic only admits string-keyed records, every tuple in the returned array preserves the original key-to-value link without lying to the compiler. If you truly need numeric keys, model them as string literals (for example, `'0' | '1'`) or build a dedicated helper that maps between numeric and string representations explicitly.

In the example, the explicit `Flags` type keeps each tuple tied to its literal key while preserving unions on the values. Checking `key === 'locale'` therefore narrows the entry to `['locale', 'en-US' | 'fr-FR']`, letting TypeScript see `value` as the locale union instead of `any`. That keeps switch statements and lookup tables honest, because the compiler will force you to handle newly added flags whenever you widen the object. Reach for this helper when you own the record’s shape—configuration maps, manifest objects, strongly typed dictionaries—and fall back to schema validation or runtime checks when you’re dealing with untrusted payloads where enumerability and key types can’t be guaranteed.
