---
title: Fetch Wrapper in TypeScript with fetch and Zod
slug: fetch-wrapper-typescript-zod
summary: A tiny typed fetch helper that validates responses with Zod, surfaces helpful errors, and keeps request/response types honest.
tags: [typescript, fetch, zod]
publishedAt: 2025-10-28
language: ts
draft: false
---

```ts
import { z } from 'zod'

type JsonInit = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown
  headers?: Record<string, string>
}

type HttpError = Error & { status: number, url?: string, body?: unknown }

function httpError(status: number, url?: string, body?: unknown): HttpError {
  const err = new Error(`HTTP ${status}${url ? ` for ${url}` : ''}`) as HttpError
  err.name = 'HttpError'
  err.status = status
  err.url = url
  err.body = body
  return err
}

export const isHttpError = (e: unknown): e is HttpError =>
  e instanceof Error && (e as Partial<HttpError>).status !== undefined

function isStreamyBody(b: unknown): b is
  | Blob
  | FormData
  | URLSearchParams
  | ArrayBuffer
  | ReadableStream {
  return (
    typeof Blob !== 'undefined' && b instanceof Blob ||
    typeof FormData !== 'undefined' && b instanceof FormData ||
    typeof URLSearchParams !== 'undefined' && b instanceof URLSearchParams ||
    (typeof ArrayBuffer !== 'undefined' && b instanceof ArrayBuffer) ||
    // Covers DataView and all TypedArrays (ArrayBufferView)
    (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' && ArrayBuffer.isView(b)) ||
    (typeof ReadableStream !== 'undefined' && b instanceof ReadableStream)
  )
}

export const request = async <S extends z.ZodTypeAny>(
  input: string | URL | Request,
  schema: S,
  init: JsonInit = {}
): Promise<z.infer<S>> => {
  const method = (
    init.method ?? (input instanceof Request ? input.method : 'GET')
  ).toUpperCase()

  if ((method === 'GET' || method === 'HEAD') && init.body !== undefined) {
    throw new Error('Request body is not allowed for GET/HEAD')
  }

  const shouldStringify = init.body !== undefined && !isStreamyBody(init.body)
  const headers = {
    Accept: 'application/json',
    ...(shouldStringify ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers ?? {})
  }

  const signal =
    init.signal ??
    ('timeout' in AbortSignal
      ? (AbortSignal as { timeout(ms: number): AbortSignal }).timeout(8000)
      : undefined)

  const res = await fetch(input, {
    ...init,
    method,
    signal,
    headers,
    body: shouldStringify ? JSON.stringify(init.body) : (init.body as BodyInit | undefined),
  })

  const responseUrl = res.url || (input instanceof Request ? input.url : input.toString())

  // Attempt to parse response as JSON (fall back to text); 204 yields null
  const text = await res.text()
  const data: unknown = text ? tryParseJson(text) : null

  if (!res.ok) {
    throw httpError(res.status, responseUrl, data)
  }

  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    const err = new Error('Invalid response shape', { cause: parsed.error }) as Error & {
      issues?: unknown
      url?: string
    }
    err.name = 'ZodValidationError'
    err.issues = parsed.error.issues
    err.url = responseUrl
    throw err
  }

  return parsed.data
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

// Example usage
const Todo = z.object({
  id: z.number(),
  title: z.string(),
  completed: z.boolean()
})

// GET
async function getTodo(id: number) {
  return request(`https://jsonplaceholder.typicode.com/todos/${id}`, Todo, { method: 'GET' })
}

// POST with a typed body (validated before send)
const CreateTodoBody = z.object({ title: z.string(), completed: z.boolean().default(false) })
type CreateTodoBody = z.infer<typeof CreateTodoBody>

async function createTodo(body: CreateTodoBody) {
  const safe = CreateTodoBody.parse(body)
  return request('https://example.com/api/todos', Todo, { method: 'POST', body: safe })
}

// Helper schema for 204/empty responses
export const Empty = z.null()
```

A light wrapper like this turns fetch into a predictable, typed pipeline: you send JSON, you expect JSON, and you validate the shape at the boundary with Zod. The helper sets sensible defaults (Accept JSON; Content‑Type only when sending JSON), serializes your `body` when it’s plain data, and passes through streamy bodies like `FormData`, `Blob`, or `URLSearchParams` without stringifying. If the server replies with a non‑2xx status, it throws an `HttpError`-shaped object that includes `status`, `url`, and the parsed body to help you branch on `error.status` or display a message.

The key step is `schema.safeParse(data)`. Rather than trusting server output, you assert the contract with a Zod schema and return `parsed.data` for correct typing. On failure, the thrown error includes `issues` and a `cause` with the original ZodError for rich debugging. For 204/empty responses, the code feeds `null` into the schema—use `z.null()`, `z.void().transform(() => null)`, or a union like `z.object(...).or(z.null())` when endpoints return nothing.

The function is framework‑agnostic and intentionally small. It accepts any `RequestInit`, merges headers, and chooses the right body handling automatically. URL reporting prefers `res.url` and falls back to `input instanceof Request ? input.url : input.toString()`, avoiding `[object Request]`. Header names are case-insensitive; if callers pass both `Content-Type` and `content-type`, the last one wins due to spread order. Some platforms treat `ReadableStream` differently across realms—this wrapper guards for presence, and if you hit edge cases, pass a `BodyInit` directly. For timeouts, defaulting to `AbortSignal.timeout(8000)` nudges callers toward cancelable fetches. From here, you can add a base URL, auth, retries, or wrap this in a factory for shared config. Keep schemas near call sites or co-located with API routes to share types across client and server.
