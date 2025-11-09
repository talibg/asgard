import type { Metadata } from 'next'
import { SettingsClient } from './settings-client'

export const metadata: Metadata = {
    title: 'Account Settings',
    description: 'Manage your TypeSnip user profile and application settings.',
    robots: {
        index: false,
        follow: false,
    },
}

export default function SettingsPage() {
    return <SettingsClient />
}
