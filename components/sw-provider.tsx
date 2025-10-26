'use client'
import { useEffect } from 'react'

// Registers the service worker on the client.
export default function SwProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Only register in production; next-pwa is disabled in dev
        if (process.env.NODE_ENV !== 'production') return
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {})
        }
    }, [])
    return <>{children}</>
}
