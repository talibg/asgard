import Link from 'next/link'

export default function ContactPage() {
    return (
        <main className="p-6 flex-1 space-y-6">
            <section className="space-y-1">
                <h1 className="text-xl font-semibold">Contact</h1>
            </section>

            <section className="space-y-2">
                <p className="text-sm text-muted-foreground">
                    Have feedback or need help? Reach out through our GitHub repository.
                </p>
                <p>
                    <Link className="text-sm underline" href="https://github.com/talibg/asgard">
                        github.com/talibg/asgard
                    </Link>
                </p>
            </section>
        </main>
    )
}
