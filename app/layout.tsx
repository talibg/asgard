import type { Metadata } from 'next'
//import AdPlaceholder from '@/components/ad-placeholder'
import AppFooter from '@/components/app-footer'
import AppHeader from '@/components/app-header'
import SwProvider from '@/components/sw-provider'
import { ThemeProvider } from '@/components/theme-provider'
import '@/app/globals.css'
import { Analytics } from '@vercel/analytics/next'
import { Fira_Code, Fira_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'

const firaSans = Fira_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    display: 'swap',
})

const firaCode = Fira_Code({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    display: 'swap',
    variable: '--font-mono',
})

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js requires exporting metadata from layout files
export const metadata: Metadata = {
    title: 'TypeSnip',
    description: 'a private, local TypeScript snippet manager',
    icons: {
        icon: [
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/favicon.ico' },
        ],
        apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
        other: [
            { rel: 'icon', url: '/android-chrome-192x192.png' },
            { rel: 'icon', url: '/android-chrome-512x512.png' },
        ],
    },
    manifest: '/manifest.webmanifest',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html className={`${firaSans.className} ${firaCode.variable} h-full`} lang="en" suppressHydrationWarning>
            <body className="h-full flex flex-col">
                <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
                    <SwProvider>
                        <AppHeader />
                        {/*<AdPlaceholder />*/}
                        {children}
                        <AppFooter />
                        <Toaster position="top-center" richColors />
                    </SwProvider>
                </ThemeProvider>
                <Analytics />
            </body>
        </html>
    )
}
