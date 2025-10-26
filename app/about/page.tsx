export default function AboutPage() {
    return (
        <main className="p-6 flex-1 space-y-6">
            <section className="space-y-2">
                <h1 className="text-xl font-semibold">TypeSnip — a private, local TypeScript snippet manager</h1>
                <p className="text-sm text-muted-foreground">
                    TypeSnip helps you organize and reuse your TypeScript code snippets — privately, directly in your
                    browser. No logins, no servers, no tracking. Everything you create stays on your device using the
                    browser’s secure IndexedDB storage.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-base font-medium">Why TypeSnip exists</h2>
                <p className="text-sm text-muted-foreground">
                    As developers, we constantly revisit small pieces of code — utility types, hooks, helper functions —
                    yet most snippet tools force you to sync through the cloud, create accounts, or hand over your code
                    to third parties. TypeSnip takes a different approach:
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Offline-first — works entirely without an internet connection.</li>
                    <li>Private by design — nothing is uploaded, indexed, or shared.</li>
                    <li>Instant — open, edit, copy, and run locally in milliseconds.</li>
                    <li>Persistent — snippets live inside your browser’s database until you delete them.</li>
                    <li>Installable — add TypeSnip to your desktop or home screen (PWA).</li>
                    <li>Beautiful UI — clean interface powered by React, Tailwind, and shadcn/ui.</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">How it works</h2>
                <p className="text-sm text-muted-foreground">
                    When you open TypeSnip for the first time, it creates a small private database inside your browser.
                    Each snippet you add — title, tags, and code — is stored there and can be searched or edited
                    offline. Because nothing leaves your device, your code never touches a server.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">Roadmap</h2>
                <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Export / import snippets as JSON</li>
                    <li>Optional encrypted cloud backup (opt-in only)</li>
                    <li>More editor themes and language modes</li>
                    <li>Browser extensions and VS Code companion</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h2 className="text-base font-medium">Who we are</h2>
                <p className="text-sm text-muted-foreground">
                    TypeSnip is built by developers for developers who value simplicity, privacy, and speed. If you’d
                    like to contribute ideas, fixes, or feedback, visit typesnip.com or reach out via our GitHub
                    discussions.
                </p>
                <p className="text-sm">TypeSnip — your snippets, your space, your device.</p>
            </section>
        </main>
    )
}
