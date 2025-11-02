import Link from 'next/link'

export default function PrivacyPolicyPage() {
    return (
        <main className="p-6 flex-1 space-y-6">
            <section className="space-y-1">
                <h1 className="text-xl font-semibold">Privacy Policy</h1>
                <div className="text-xs text-muted-foreground">Effective Date: October 2025</div>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">1. Overview</h2>
                <p className="text-sm text-muted-foreground">
                    TypeSnip (&quot;we,&quot; &quot;us&quot;) is a browser-based code snippet manager. This policy explains
                    what information the application handles and how we protect your privacy.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">2. No server-side storage</h2>
                <p className="text-sm text-muted-foreground">
                    The application runs entirely in your browser. All snippets, tags, and configuration data are stored
                    locally in your browser&apos;s IndexedDB storage. We do not receive, process, or replicate your data
                    on our servers because no servers are involved in the app experience.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">3. Cookies and tracking</h2>
                <p className="text-sm text-muted-foreground">
                    TypeSnip does not currently use cookies or similar tracking technologies. If we add cookies in the
                    future to support analytics or privacy-conscious advertising, we will do so only after obtaining
                    your explicit consent and providing a clear explanation of their purpose.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">4. Your control</h2>
                <p className="text-sm text-muted-foreground">
                    Because your data stays in your browser, you can remove it at any time by clearing your browser
                    storage or uninstalling the TypeSnip PWA. Doing so permanently deletes your snippets and settings.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">5. Third-party services</h2>
                <p className="text-sm text-muted-foreground">
                    Public pages on typesnip.com (such as the blog) may link to or embed third-party resources. Those
                    services have their own privacy practices, and we encourage you to review their policies before
                    interacting with them.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">6. Changes to this policy</h2>
                <p className="text-sm text-muted-foreground">
                    We may update this Privacy Policy as the product evolves. Updates will be posted here, and the
                    current version will always be available at{' '}
                    <Link href="/privacy-policy">https://typesnip.com/privacy-policy</Link>.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">7. Contact</h2>
                <p className="text-sm text-muted-foreground">
                    Questions about privacy or data handling? Reach the maintainers via{' '}
                    <a href="https://talibg.com">talibg.com</a> or open an issue on our GitHub repository.
                </p>
            </section>

            <section>
                <p className="text-sm">
                    In summary: your snippets stay on your device, we currently avoid cookies entirely, and any future
                    tracking will require your consent.
                </p>
            </section>
        </main>
    )
}
