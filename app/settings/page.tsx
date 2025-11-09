'use client'

import type { Metadata } from 'next'
import { useRef } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import ThemeToggle from '@/components/theme-toggle'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { type Snippet, Snippets } from '@/lib/snippets-store'

export const metadata: Metadata = {
    title: 'Account Settings',
    description: 'Manage your TypeSnip user profile and application settings.',
    robots: {
        index: false,
        follow: false,
    },
}

export default function SettingsPage() {
    const fileRef = useRef<HTMLInputElement | null>(null)

    const exportJson = async () => {
        try {
            const json = await Snippets.exportJson()
            const blob = new Blob([json], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
            a.href = url
            a.download = `asgard-snippets-${ts}.json`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            toast.success('Exported snippets')
        } catch (_e) {
            toast.error('Failed to export')
        }
    }

    const snippetSchema = z.object({
        id: z.string(),
        title: z.string(),
        code: z.string(),
        tags: z.array(z.string()),
        createdAt: z.number(),
        updatedAt: z.number(),
        language: z.enum(['ts', 'tsx']),
    })

    const importSchema = z.union([
        z.object({ v: z.number().optional(), items: z.array(snippetSchema) }),
        z.array(snippetSchema),
    ])

    const onPickImport = () => fileRef.current?.click()

    const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const text = await file.text()
            const parsed = JSON.parse(text)
            const data = importSchema.parse(parsed)
            const items = Array.isArray(data) ? data : data.items
            // naive merge: upsert by id
            await Snippets.upsertMany(items as Snippet[])
            toast.success(`Imported ${items.length} snippet${items.length === 1 ? '' : 's'}`)
        } catch (_err) {
            toast.error('Invalid import file')
        } finally {
            e.target.value = ''
        }
    }

    const onClearDb = async () => {
        try {
            await Snippets.clear()
            toast.success('Database cleared')
        } catch {
            toast.error('Failed to clear database')
        }
    }
    return (
        <main className="p-3 space-y-3 flex-1">
            <h1 className="text-xl font-semibold">Settings</h1>
            <section className="space-y-2">
                <div className="text-sm text-muted-foreground">Personalize your experience.</div>
                <div className="flex items-center gap-2">
                    <span className="text-sm">Theme</span>
                    <ThemeToggle />
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="text-base font-medium">Data</h2>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={exportJson}>Export JSON</Button>
                    <Button onClick={onPickImport} variant="outline">
                        Import JSON
                    </Button>
                    <input
                        accept="application/json"
                        className="hidden"
                        onChange={onImportFile}
                        ref={fileRef}
                        type="file"
                    />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Delete Database</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete all snippets?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently remove all snippets stored in your browser. This action cannot
                                    be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onClearDb}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </section>
        </main>
    )
}
