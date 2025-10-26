import { Braces } from 'lucide-react'
import Link from 'next/link'
import NewSnippetButton from '@/components/new-snippet-button'
import ThemeToggle from '@/components/theme-toggle'

export default function AppHeader() {
    return (
        <header className="flex items-center justify-between border-b px-4 py-3 gap-3">
            <Link className="font-semibold flex" href="/">
                <Braces className="pr-3" /> TypeSnip
            </Link>
            <div className="flex items-center gap-2">
                <NewSnippetButton label="Snippet" />
                <ThemeToggle />
            </div>
        </header>
    )
}
