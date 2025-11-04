---
title: Type-Safe Object.keys Helper
slug: type-safe-object-keys-helper
summary: Keep Object.keys aligned with your literal key types so mapped iterations stay safe without casts.
tags: [typescript, utilities, records]
publishedAt: 2025-11-04
language: ts
draft: false
---

```ts
type StringKeyOf<T> = Extract<keyof T, string>
type NumberKeyOf<T> = Extract<keyof T, number>
type KeyStrings<T> = StringKeyOf<T> | `${NumberKeyOf<T>}`

export function typedKeys<T extends readonly unknown[]>(obj: T): `${number}`[]
export function typedKeys<T extends Record<PropertyKey, unknown>>(obj: T): KeyStrings<T>[]
export function typedKeys(obj: object) {
  return Object.keys(obj) as any
}

type PermissionMatrix = {
  read: boolean
  write: boolean
  admin: boolean
  10: boolean
}

const permissions: PermissionMatrix = {
  read: true,
  write: false,
  admin: false,
  10: true,
}

const toggled = typedKeys(permissions).filter((key) => key !== '10')
// inferred as Array<'read' | 'write' | 'admin' | '10'>

const lifecycle = ['plan', 'build', 'ship'] as const
const indices = typedKeys(lifecycle)
// inferred as Array<`${number}`>
```

`Object.keys` is the obvious way to fan out across an object's properties, yet its return type has never kept up with TypeScript's structural typing. It promises you a `string[]`, which instantly loses the relationship between the keys you receive and the shape of the source object. You end up casting inside loops or letting TypeScript fall back to `any`, both of which mask bugs that only surface when a typo slips into production.

The `typedKeys` helper restores that missing link with a tiny trio of type aliases and overloads that mirror runtime behavior. `StringKeyOf<T>` captures the literal string keys you declared, `NumberKeyOf<T>` grabs numeric ones, and `KeyStrings<T>` turns those numbers into the string forms that `Object.keys` actually emits. Arrays and tuples pick the other overload, returning stringified numbers (`\`${number}\``) because `Object.keys` only produces indices, never the inherited `length` or prototype members. The implementation stays one line, delegating the heavy lifting to the type signatures.

When you call the helper with a `PermissionMatrix`, TypeScript instantiates the record overload and threads the literal keys straight through. The numeric slot `10` reappears as `'10'`, so the returned union becomes `'read' | 'write' | 'admin' | '10'`. That keeps downstream logic honest—you can narrow on `'10'` explicitly or coerce it back to the numeric literal when you need to index, and the compiler will still protest if you drift away from the real shape.

Tuples benefit as well. Passing `['plan', 'build', 'ship'] as const` picks the array overload, so the result becomes `Array<\`${number}\`>`, accurately reflecting that only stringified indices show up at runtime. That avoids pretending to know the exact length while still differentiating these keys from arbitrary strings, and it sidesteps the `never[]` trap you hit when you try to extract numeric tuple indices directly from `keyof T`. The implementation body stays tiny, deferring the heavy lifting to the type system while leaving runtime semantics untouched.

This pattern intentionally ignores symbols because `Object.keys` does the same, so prefer `Object.getOwnPropertySymbols` when you need them. If you pass something wider like `Record<string, boolean>`, the helper widens to `string[]`, mirroring the fact that the static type can no longer promise literal coverage. For object literals, discriminated maps, and readonly tuples, though, this overload-based wrapper finally aligns TypeScript’s understanding of `Object.keys` with what JavaScript hands back.
