import type { Metadata } from 'next'
import { BlogClient } from './blog-client'

export const metadata: Metadata = {
    title: 'Blog',
    description: 'Bite-sized notes and snippets on TypeScript and developer tooling.',
    openGraph: {
        title: 'Typesnip Blog',
        description: 'Discover quick tips, snippets, and thoughts on TypeScript and tooling.',
    },
}

export default function PostsIndex() {
    return <BlogClient />
}
