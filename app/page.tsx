import { Suspense } from 'react'
import SnippetClient from '@/components/snippet-client'
import { Skeleton } from '@/components/ui/skeleton'

export default function Page() {
    return (
        <main className="flex-1 px-3 pb-3 overflow-hidden">
            <Suspense
                fallback={
                    <div className="grid grid-cols-[320px_1fr] gap-4 h-full min-h-0">
                        <aside className="flex flex-col border rounded min-h-0 p-3">
                            <div className="mb-3">
                                <Skeleton className="h-9 w-full" />
                            </div>
                            <div className="mb-3 flex items-center gap-2">
                                <Skeleton className="h-9 w-32" />
                                <Skeleton className="h-9 w-9" />
                            </div>
                            <div className="space-y-2 overflow-auto">
                                <Skeleton className="h-14 w-full" />
                                <Skeleton className="h-14 w-full" />
                                <Skeleton className="h-14 w-full" />
                            </div>
                        </aside>
                        <section className="border rounded p-3 min-h-0 overflow-hidden flex flex-col">
                            <div className="flex gap-2 mb-3">
                                <Skeleton className="h-9 w-64" />
                                <Skeleton className="h-9 w-20" />
                            </div>
                            <Skeleton className="h-[60vh] w-full" />
                            <div className="flex items-center gap-2 mt-3">
                                <Skeleton className="h-9 w-40" />
                            </div>
                        </section>
                    </div>
                }
            >
                <SnippetClient />
            </Suspense>
        </main>
    )
}
