import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingTagDetail() {
    return (
        <main className="max-w-4xl mx-auto px-4 py-12">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-28 mb-6" />
            <ul className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <li className="border rounded-xl p-4 bg-card" key={i}>
                        <div className="flex items-start justify-between gap-3">
                            <Skeleton className="h-6 flex-1" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="mt-3 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                        </div>
                        <div className="flex gap-2 flex-wrap mt-3">
                            {Array.from({ length: 3 }).map((_, j) => (
                                <Skeleton className="h-6 w-14 rounded-full" key={j} />
                            ))}
                        </div>
                    </li>
                ))}
            </ul>
        </main>
    )
}
