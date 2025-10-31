---
title: Tiny TypeScript Random ID Generator (with crypto)
slug: tiny-typescript-random-id-generator-crypto
summary: Generate short, URL‑safe IDs in TypeScript using Web Crypto with a safe fallback and zero bias.
tags: [typescript, crypto, utilities, ids]
publishedAt: 2025-10-31
language: ts
draft: false
---

```ts
const URL64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_' as const

type RandomIdOptions = {
  length?: number 
  alphabet?: string 
}

function getCrypto(): Crypto | undefined {
  try {
    const c = (globalThis as any)?.crypto
    return c && typeof c.getRandomValues === 'function' ? c : undefined
  } catch {
    return undefined
  }
}

function fillRandom(bytes: Uint8Array): void {
  const c = getCrypto()
  if (c) {
    c.getRandomValues(bytes)
    return
  }
  for (let i = 0; i < bytes.length; i++) bytes[i] = (Math.random() * 256) | 0
}

function nextPow2Mask(n: number): number {
  const p = 1 << Math.ceil(Math.log2(n))
  return p - 1
}

export function randomId(opts?: number | RandomIdOptions): string {
  const length = typeof opts === 'number' ? opts : opts?.length ?? 16
  const alphabet = (typeof opts === 'object' && opts?.alphabet) || URL64

  if (length <= 0) return ''
  if (alphabet.length <= 1) throw new Error('alphabet must have length >= 2')

  const mask = nextPow2Mask(alphabet.length)
  const isPow2 = (alphabet.length & (alphabet.length - 1)) === 0

  const out: string[] = new Array(length)

  if (isPow2) {
    const bytes = new Uint8Array(length)
    fillRandom(bytes)
    for (let i = 0; i < length; i++) {
      out[i] = alphabet[bytes[i] & mask]
    }
    return out.join('')
  }

  const step = Math.ceil(length * 1.6)
  let i = 0
  while (i < length) {
    const buf = new Uint8Array(step)
    fillRandom(buf)
    for (let j = 0; j < buf.length && i < length; j++) {
      const idx = buf[j] & mask
      if (idx < alphabet.length) {
        out[i++] = alphabet[idx]
      }
    }
  }
  return out.join('')
}

// Examples
// 16‑char URL‑safe ID
console.log(randomId())

// 10‑char base32 ID (lowercase letters + digits, 32‑char alphabet)
console.log(randomId({ length: 10, alphabet: 'abcdefghijklmnopqrstuvwxyz234567' }))

// 21‑char Nano‑style alphabet (non‑power‑of‑two, unbiased via rejection sampling)
console.log(randomId({ length: 21, alphabet: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_' }))
```

Generating unique IDs is a daily need: correlating requests, tagging ephemeral UI elements, or creating stable cache keys. UUIDs are convenient but long; for many app‑level identifiers, short URL‑safe strings are a better fit. This tiny helper uses the Web Crypto API to produce unbiased random IDs with a 64‑character, URL‑safe alphabet by default (`0–9A–Za–z-_`). Because the alphabet length is a power of two, the implementation maps the low bits of each random byte directly to an index using a bitmask, yielding uniform distribution without costly loops or modulo bias.

The function accepts either a number (length) or an options object with `length` and `alphabet`. For non‑power‑of‑two alphabets, it switches to a small rejection‑sampling loop: it masks random bytes to a nearby power‑of‑two range and discards values that would skew the distribution, ensuring each character is equally likely. The default length is 16 characters, which gives 96 bits of entropy with the 64‑symbol alphabet—more than enough for most client‑side identifiers.

A couple of practical notes: it guards for SSR and older environments by feature‑detecting `crypto.getRandomValues`, falling back to `Math.random` only when necessary (less secure, but keeps examples runnable). The API is dependency‑free and works in modern browsers and recent Node.js versions that expose `globalThis.crypto`. If you need stronger guarantees (e.g., cryptographic tokens), prefer standard UUIDv4 or server‑generated secrets; for compact, human‑and‑URL‑friendly IDs, this approach balances quality, speed, and size.

When to use it: client keys, deduplication tags, and ephemeral UI IDs where collisions must be vanishingly rare but payload size matters. When not to: long‑term authentication secrets or attacker‑visible tokens—use vetted libraries and protocols instead. If you standardize on one alphabet across your app (URL64 above or a base32 set), you’ll get consistent IDs that paste cleanly into URLs, logs, and database keys.

