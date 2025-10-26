'use client'

import { Trash2 } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Snippet } from '@/lib/idb'
import { cn } from '@/lib/utils'

type Props = {
    items: Snippet[]
    selectedId?: string | undefined
    onSelect: (id: string) => void
    onDelete?: (id: string) => void
}

export default function SnippetList({ items, selectedId, onSelect, onDelete }: Props) {
    return (
        <ul>
            {items.map((s) => (
                <li
                    className={cn('px-3 py-2 cursor-pointer hover:bg-accent', selectedId === s.id && 'bg-accent')}
                    key={s.id}
                    onClick={() => onSelect(s.id)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onSelect(s.id)
                        }
                    }}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="font-medium truncate">{s.title || 'Untitled'}</div>
                            <div className="text-xs text-muted-foreground">
                                {new Date(s.updatedAt).toLocaleString()}
                            </div>
                        </div>
                        {onDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        aria-label="Delete snippet"
                                        onClick={(e) => e.stopPropagation()}
                                        size="icon-sm"
                                        variant="ghost"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete snippet?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the snippet "
                                            {s.title || 'Untitled'}".
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDelete(s.id)
                                            }}
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                    {s.tags?.length ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                            {s.tags.slice(0, 5).map((t, i) => (
                                <Badge key={`${s.id}-tag-${i}`} variant="secondary">
                                    {t}
                                </Badge>
                            ))}
                            {s.tags.length > 5 && (
                                <Badge key={`${s.id}-more`} variant="secondary">
                                    +{s.tags.length - 5}
                                </Badge>
                            )}
                        </div>
                    ) : null}
                </li>
            ))}
        </ul>
    )
}
