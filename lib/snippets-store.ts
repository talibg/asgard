import { createStore } from '@/lib/db'

export type SnippetId = string

export type Snippet = {
    id: SnippetId
    title: string
    code: string
    tags: string[]
    createdAt: number
    updatedAt: number
    language: 'ts' | 'tsx'
}

const DB_NAME = 'snippets-db'
const DB_VERSION = 1

export const Snippets = createStore<Snippet, 'id'>({
    dbName: DB_NAME,
    version: DB_VERSION,
    storeName: 'snippets',
    keyField: 'id',
    indexes: [
        { name: 'by_title', keyPath: 'title' },
        { name: 'by_updatedAt', keyPath: 'updatedAt' },
        { name: 'by_tags', keyPath: 'tags', multiEntry: true },
    ],
    textSearchFields: ['title', 'tags', 'code'],
})

export const onChange = Snippets.onChange
