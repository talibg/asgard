'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    const lightVariant = mounted && resolvedTheme === 'light' ? 'default' : 'outline'
    const darkVariant = mounted && resolvedTheme === 'dark' ? 'default' : 'outline'

    return (
        <div className="inline-flex items-center gap-2">
            <Button aria-label="Use light theme" onClick={() => setTheme('light')} size="sm" variant={lightVariant}>
                <Sun className="size-4" />
                Light
            </Button>
            <Button aria-label="Use dark theme" onClick={() => setTheme('dark')} size="sm" variant={darkVariant}>
                <Moon className="size-4" />
                Dark
            </Button>
        </div>
    )
}
