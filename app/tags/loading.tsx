import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingTags() {
    return (
        <main className="max-w-4xl mx-auto px-4 py-12">
            <Skeleton className="h-9 w-32 mb-4" />
            <Skeleton className="h-5 w-2/3 mb-6" />
            <div className="flex flex-wrap gap-2">
                {Array.from({ length: 16 }).map((_, i) => (
                    <Skeleton className="h-7 w-20 rounded-full" key={i} />
                ))}
            </div>
        </main>
    )
}
