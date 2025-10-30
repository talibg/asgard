---
title: Typed Clipboard Utility
slug: typed-clipboard-utility
summary: A tiny, typed wrapper around the Clipboard API with safe fallbacks, permission probes, and SSR guards.
tags: [typescript, utilities, dom, clipboard]
publishedAt: 2025-10-30
language: ts
draft: false
---

```ts
type ClipboardAPI = {
  supported: boolean
  readText(): Promise<string>
  writeText(text: string): Promise<void>
  canRead(): Promise<boolean>
  canWrite(): Promise<boolean>
}

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'
const hasClipboard = isBrowser && !!navigator.clipboard

export const clipboard: ClipboardAPI = {
  supported: hasClipboard,
  async readText() {
    if (!hasClipboard) throw new Error('Clipboard API not available')
    return navigator.clipboard.readText()
  },
  async writeText(text: string) {
    if (!hasClipboard) return legacyCopy(text)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      await legacyCopy(text)
    }
  },
  async canRead() {
    return queryPermission('clipboard-read')
  },
  async canWrite() {
    return queryPermission('clipboard-write')
  }
}

async function queryPermission(name: 'clipboard-read' | 'clipboard-write'): Promise<boolean> {
  try {
    if (!isBrowser || !('permissions' in navigator) || !navigator.permissions?.query) return false
    const status = await navigator.permissions.query({ name } as unknown as PermissionDescriptor)
    return status.state === 'granted' || status.state === 'prompt'
  } catch {
    return false
  }
}

function legacyCopy(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (!isBrowser) throw new Error('Not in a browser environment')
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.top = '-9999px'
      document.body.appendChild(ta)
      const sel = document.getSelection()
      const prev = sel && sel.rangeCount ? sel.getRangeAt(0) : null
      ta.select()
      const ok = document.execCommand('copy')
      if (prev && sel) {
        sel.removeAllRanges()
        sel.addRange(prev)
      }
      document.body.removeChild(ta)
      if (!ok) throw new Error('execCommand copy failed')
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

// Example
async function demo() {
  if (!(await clipboard.canWrite())) {
    console.warn('Clipboard may prompt or be blocked')
  }
  await clipboard.writeText('Hello clipboard!')
  console.log('copied:', await clipboard.readText())
}
```

Copying to the clipboard should be simple and predictable, but real‑world differences across browsers, permissions, and server‑side rendering can trip you up. This tiny wrapper exposes a typed `clipboard` object with explicit return types and a consistent surface: `readText()`, `writeText()`, and capability probes via `canRead()`/`canWrite()`. The `supported` flag tells you whether the modern `navigator.clipboard` API is present; on older engines, `writeText` falls back to a textarea + `document.execCommand('copy')` shim, which still works widely despite being deprecated.

The `queryPermission` helper asks the Permissions API about `clipboard-read` and `clipboard-write`. Not every browser exposes these names in types or behavior, so the function is defensive: it feature‑detects the API, handles exceptions, and returns `false` if the query isn’t available. Treat the result as advisory—many engines only grant access in response to a user gesture, meaning a call without a click may still fail even if the status says “prompt”. All methods return Promises and never block the event loop.

A few practical notes:
- Use HTTPS and a user gesture. Clipboard access is typically restricted to secure contexts and often requires a click.
- Expect timer clamping and task ordering when sequencing UI steps around clipboard calls; yields still happen on the macrotask queue.
- Prefer the Clipboard API when available for better UX, but keep the fallback for resilience until you can drop older browsers.

When to use this wrapper: whenever you need a minimal, typed abstraction that works in modern browsers, warns about likely prompts, and avoids SSR pitfalls with simple guards. If you need richer features (files, images, structured formats), extend the API around `navigator.clipboard.read()`/`write()` items and gate on MIME support; the core shape stays the same.

