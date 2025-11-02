import { Braces } from 'lucide-react'
import Link from 'next/link'

export default function AppFooter() {
    return (
        <footer className="border-t px-4 py-3 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-3">
                <span className="flex">
                    © {new Date().getFullYear()} <Braces className="mx-1" size={12} /> TypeSnip by
                    <a className="px-1" href="https://talibg.com" rel="noopener" target="_blank">
                        talibg
                    </a>
                </span>
                <div className="flex items-center gap-3">
                    <Link className="hover:text-foreground underline underline-offset-4" href="/">
                        Snippets
                    </Link>
                    <Link className="hover:text-foreground underline underline-offset-4" href="/blog">
                        Blog
                    </Link>
                    <Link className="hover:text-foreground underline underline-offset-4" href="/about">
                        About
                    </Link>
                    <Link className="hover:text-foreground underline underline-offset-4" href="/terms">
                        Terms
                    </Link>
                    <Link className="hover:text-foreground underline underline-offset-4" href="/privacy-policy">
                        Privacy
                    </Link>
                    <Link className="hover:text-foreground underline underline-offset-4" href="/contact">
                        Contact
                    </Link>
                    <Link className="hover:text-foreground underline underline-offset-4" href="/settings">
                        Settings
                    </Link>
                </div>
            </div>
        </footer>
    )
}
