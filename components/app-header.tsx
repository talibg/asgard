import { Braces } from 'lucide-react'
import Link from 'next/link'
import NewSnippetButton from '@/components/new-snippet-button'
import ThemeToggle from '@/components/theme-toggle'

export default function AppHeader() {
    return (
        <header className="flex items-center justify-between border-b px-4 py-3 gap-3">
            <Link className="font-semibold flex items-center" href="/">
                <Braces className="pr-3" />
                <span>TypeSnip</span>
                <span className="hidden md:inline text-muted-foreground ml-2">— a private, local TypeScript snippet manager</span>
            </Link>
            <div className="flex items-center gap-2">
                <NewSnippetButton label="Snippet" />
                <ThemeToggle />
            </div>
        </header>
    )
}
