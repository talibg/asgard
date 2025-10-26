'use client'

import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Props = {
    value: string
    onChange: (next: string) => void
    tsx?: boolean
}

export default function TsEditor({ value, onChange, tsx = false }: Props) {
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        const root = document.documentElement
        const sync = () => setIsDark(root.classList.contains('dark'))
        sync()
        const mo = new MutationObserver(sync)
        mo.observe(root, { attributes: true, attributeFilter: ['class'] })
        return () => {
            mo.disconnect()
        }
    }, [])

    const extensions = useMemo(() => {
        const base = [javascript({ typescript: true, jsx: tsx }), EditorView.lineWrapping]
        return isDark ? [...base, oneDark] : base
    }, [tsx, isDark])

    const handleChange = useCallback((v: string) => onChange(v), [onChange])

    return (
        <div className="h-full">
            <CodeMirror
                basicSetup={{ lineNumbers: true }}
                extensions={extensions}
                height="100%"
                onChange={handleChange}
                theme={isDark ? oneDark : 'light'}
                value={value}
            />
        </div>
    )
}
