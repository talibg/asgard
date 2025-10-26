import Link from 'next/link'

export default function TermsPage() {
    return (
        <main className="p-6 flex-1 space-y-6">
            <section className="space-y-1">
                <h1 className="text-xl font-semibold">Terms of Use</h1>
                <div className="text-xs text-muted-foreground">Effective Date: October 2025</div>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">1. Overview</h2>
                <p className="text-sm text-muted-foreground">
                    TypeSnip (“we,” “our,” “us”) provides a web application that runs entirely in your browser. By using
                    TypeSnip, you agree to these Terms of Use.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">2. Local-only service</h2>
                <p className="text-sm text-muted-foreground">
                    TypeSnip stores all user data — including code snippets, titles, and tags — solely within your
                    browser’s IndexedDB. We do not host, process, or transmit your data to any server operated by us.
                    Deleting your browser data or uninstalling the PWA will permanently remove your snippets.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">3. No accounts or personal data</h2>
                <p className="text-sm text-muted-foreground">
                    TypeSnip does not require or support user accounts. We do not collect personal information, email
                    addresses, or authentication credentials.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">4. Intellectual property</h2>
                <p className="text-sm text-muted-foreground">
                    All code snippets you create remain entirely yours. You retain full ownership and responsibility for
                    their content, legality, and usage. The TypeSnip application and branding are protected by copyright
                    and may not be redistributed or sold without permission.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">5. Acceptable use</h2>
                <p className="text-sm text-muted-foreground">You agree not to use TypeSnip for:</p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Distributing unlawful or malicious content,</li>
                    <li>Attempting to compromise or reverse engineer the application code,</li>
                    <li>Embedding TypeSnip in products that misrepresent authorship.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">6. Third-party content</h2>
                <p className="text-sm text-muted-foreground">
                    Public pages on typesnip.com (e.g., blog or guides) may reference third-party resources. External
                    links are provided for convenience; we are not responsible for their content or policies.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">7. Disclaimer of warranty</h2>
                <p className="text-sm text-muted-foreground">
                    TypeSnip is provided “as is,” without warranties of any kind, express or implied. We do not
                    guarantee uninterrupted operation, compatibility, or that stored data will never be lost (clearing
                    browser storage will delete it).
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">8. Limitation of liability</h2>
                <p className="text-sm text-muted-foreground">
                    To the fullest extent permitted by law, TypeSnip shall not be liable for any indirect, incidental,
                    or consequential damages arising from your use of the application.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">9. Changes to these terms</h2>
                <p className="text-sm text-muted-foreground">
                    We may update these Terms from time to time. Continued use after updates constitutes acceptance of
                    the revised terms. The current version will always be available at{' '}
                    <Link href="/terms">https://typesnip.com/terms</Link>.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">10. Contact</h2>
                <p className="text-sm text-muted-foreground">
                    For questions about these Terms or the app in general, contact the maintainers via
                    <a href="https://talibg.com">talibg.com</a> or open an issue on our GitHub repository.
                </p>
            </section>

            <section>
                <p className="text-sm">
                    In short: TypeSnip never sees your code, never stores it online, and leaves full control in your
                    hands.
                </p>
            </section>
        </main>
    )
}
