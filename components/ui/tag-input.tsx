'use client'

import { XIcon } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Props = {
    value: string[]
    onChange: (next: string[]) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export default function TagInput({ value, onChange, placeholder, className, disabled }: Props) {
    const [input, setInput] = useState('')
    const inputRef = useRef<HTMLInputElement | null>(null)

    const normalized = useMemo(() => value.filter(Boolean), [value])

    const commitTag = useCallback(
        (raw: string) => {
            const t = raw.trim()
            if (!t) return
            if (normalized.some((x) => x.toLowerCase() === t.toLowerCase())) {
                setInput('')
                return
            }
            onChange([...normalized, t])
            setInput('')
        },
        [normalized, onChange],
    )

    const removeAt = useCallback(
        (idx: number) => {
            const next = normalized.slice()
            next.splice(idx, 1)
            onChange(next)
            // keep focus on input for quick editing
            inputRef.current?.focus()
        },
        [normalized, onChange],
    )

    const _onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return
        const k = e.key
        if (k === 'Enter' || k === 'Tab' || k === ',') {
            e.preventDefault()
            commitTag(input)
            return
        }
        if (k === 'Backspace' && input.length === 0 && normalized.length > 0) {
            e.preventDefault()
            removeAt(normalized.length - 1)
            return
        }
    }

    const _onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (disabled) return
        const txt = e.clipboardData.getData('text')
        if (!txt) return
        const parts = txt
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        if (parts.length > 1) {
            e.preventDefault()
            const existing = new Set(normalized.map((t) => t.toLowerCase()))
            const merged = [...normalized]
            for (const p of parts) {
                if (!existing.has(p.toLowerCase())) merged.push(p)
            }
            onChange(merged)
            setInput('')
        }
    }

    return (
        <>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: composite input focuses inner field on click */}
            <div
                aria-disabled={disabled}
                className={cn(
                    // mirror Input styles
                    'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input min-h-9 w-full min-w-0 rounded-md border bg-transparent px-2 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                    'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
                    className,
                )}
                onClick={() => inputRef.current?.focus()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        inputRef.current?.focus()
                    }
                }}
            >
                <div className="flex flex-wrap items-center gap-1">
                    {normalized.map((t, i) => (
                        <Badge className="select-none" key={t} variant="secondary">
                            <span>{t}</span>
                            {!disabled && (
                                <button
                                    aria-label={`Remove ${t}`}
                                    className="ml-1 inline-flex items-center justify-center hover:opacity-80"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeAt(i)
                                    }}
                                    type="button"
                                >
                                    <XIcon className="size-3" />
                                </button>
                            )}
                        </Badge>
                    ))}
                    <input
                        className={cn(
                            'bg-transparent outline-none flex-1 min-w-[6rem] px-1 py-1 text-sm',
                            normalized.length ? 'placeholder:opacity-0' : '',
                        )}
                        disabled={disabled}
                        onBlur={() => commitTag(input)}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={_onKeyDown}
                        onPaste={_onPaste}
                        placeholder={placeholder}
                        ref={inputRef}
                        value={input}
                    />
                </div>
            </div>
        </>
    )
}
