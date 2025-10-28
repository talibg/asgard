import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingPost() {
    return (
        <article className="max-w-4xl mx-auto px-4 py-12">
            <Skeleton className="h-5 w-28 mb-6" />
            <div className="mb-6 space-y-3">
                <Skeleton className="h-9 w-4/5" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton className="h-6 w-16 rounded-full" key={i} />
                    ))}
                </div>
            </div>
            <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton
                        className={`h-4 ${i % 3 === 0 ? 'w-11/12' : i % 3 === 1 ? 'w-10/12' : 'w-full'}`}
                        key={i}
                    />
                ))}
            </div>
        </article>
    )
}
