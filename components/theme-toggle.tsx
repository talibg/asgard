'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    const isDark = mounted && resolvedTheme === 'dark'
    const icon = isDark ? <Sun className="size-4" /> : <Moon className="size-4" />
    const next = isDark ? 'light' : 'dark'

    return (
        <Button
            aria-label="Toggle theme"
            onClick={() => setTheme(next)}
            size="icon"
            title="Toggle theme"
            type="button"
            variant="outline"
        >
            {icon}
        </Button>
    )
}
