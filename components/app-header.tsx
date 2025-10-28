'use client'

import { Braces } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

export default function AppHeader() {
    const pathname = usePathname()
    const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))
    const linkClass = (href: string) =>
        cn(
            'px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground text-sm',
            isActive(href) && 'bg-accent text-accent-foreground',
        )

    return (
        <header className="flex items-center justify-between border-b px-4 py-3 gap-3">
            <Link className="font-semibold flex items-center" href="/">
                <Braces className="pr-3" />
                <span>TypeSnip</span>
                <span className="hidden md:inline text-muted-foreground ml-2">
                    — a private, local TypeScript snippet manager
                </span>
            </Link>
            <div className="flex items-center gap-3">
                <nav className="flex items-center gap-2">
                    <Link aria-current={isActive('/') ? 'page' : undefined} className={linkClass('/')} href="/">
                        Snippets
                    </Link>
                    <Link
                        aria-current={isActive('/blog') ? 'page' : undefined}
                        className={linkClass('/blog')}
                        href="/blog"
                    >
                        Blog
                    </Link>
                </nav>
                <ThemeToggle />
            </div>
        </header>
    )
}
