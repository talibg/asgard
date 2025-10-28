'use client'

import { useEffect, useRef } from 'react'

type Props = { html: string }

export default function ProseHtml({ html }: Props) {
    const ref = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const root = ref.current
        if (!root) return

        const pres = Array.from(root.querySelectorAll('pre')) as HTMLPreElement[]
        for (const pre of pres) {
            // Avoid duplicating buttons on re-renders
            if (pre.querySelector('[data-copy-button]')) continue

            pre.classList.add('relative', 'group')

            const btn = document.createElement('button')
            btn.type = 'button'
            btn.setAttribute('data-copy-button', 'true')
            btn.className = [
                'absolute',
                'top-2',
                'right-2',
                'z-10',
                'inline-flex',
                'items-center',
                'gap-1',
                'rounded-md',
                'border',
                'border-border',
                'bg-background/70',
                'backdrop-blur',
                'px-2',
                'py-1',
                'text-[11px]',
                'text-foreground',
                'hover:bg-background',
                'transition-colors',
            ].join(' ')
            btn.textContent = 'Copy'

            const code = pre.querySelector('code')
            const toCopy = () => (code?.textContent ?? '').replace(/\n+$/g, '\n')

            btn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(toCopy())
                    const prev = btn.textContent
                    btn.textContent = 'Copied!'
                    setTimeout(() => {
                        btn.textContent = prev ?? 'Copy'
                    }, 1200)
                } catch {
                    // Fallback: select and copy via execCommand
                    const range = document.createRange()
                    if (code?.firstChild) {
                        range.selectNodeContents(code)
                        const sel = window.getSelection()
                        sel?.removeAllRanges()
                        sel?.addRange(range)
                        document.execCommand('copy')
                        sel?.removeAllRanges()
                        const prev = btn.textContent
                        btn.textContent = 'Copied!'
                        setTimeout(() => {
                            btn.textContent = prev ?? 'Copy'
                        }, 1200)
                    }
                }
            })

            pre.appendChild(btn)
        }
    }, [])

    return (
        <div
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
            ref={ref}
        />
    )
}
