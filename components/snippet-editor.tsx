'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { Controller, type FieldErrors, type Resolver, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import TsEditor from '@/components/ts-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import TagInput from '@/components/ui/tag-input'
import type { Snippet } from '@/lib/idb'
import { Snippets } from '@/lib/idb'

type Props = {
    initial: Snippet
    onSaved: () => void
}

const formSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    code: z.string().min(1, 'Code is required'),
    tags: z.array(z.string().min(1)).max(50).default([]),
    language: z.enum(['ts', 'tsx']),
})

type FormValues = { title: string; code: string; tags: string[]; language: 'ts' | 'tsx' }

export default function SnippetEditor({ initial, onSaved }: Props) {
    const isNew = initial.createdAt === initial.updatedAt
    const [saving, setSaving] = useState(false)
    const [isMac, setIsMac] = useState(false)

    const { control, register, handleSubmit, watch, reset, formState } = useForm<FormValues>({
        resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
        mode: 'onChange',
        defaultValues: {
            title: initial.title,
            code: initial.code,
            tags: initial.tags,
            language: initial.language,
        },
    })

    const isDirty = formState.isDirty
    const language = watch('language')

    const onSubmit = useCallback(
        async (values: FormValues) => {
            if (saving || !isDirty) return
            setSaving(true)
            const now = Date.now()
            const next: Snippet = {
                ...initial,
                title: values.title.trim(),
                code: values.code,
                tags: values.tags,
                language: values.language,
                updatedAt: now,
            }
            await Snippets.put(next)
            toast.success('Snippet saved')
            onSaved()
            // reset form state to the saved values so it's not dirty
            reset({ title: next.title, code: next.code, tags: next.tags, language: next.language })
            setSaving(false)
        },
        [initial, isDirty, saving, reset, onSaved],
    )

    const onInvalid = useCallback((errors: FieldErrors<FormValues>) => {
        const msgs: string[] = []
        if (errors?.title?.message) msgs.push(String(errors.title.message))
        if (errors?.code?.message) msgs.push(String(errors.code.message))
        if (msgs.length) toast.error(msgs.join(' • '))
    }, [])

    // Global save shortcut: Cmd/Ctrl+S
    useEffect(() => {
        const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform)
        setIsMac(mac)
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                e.preventDefault()
                if (isDirty && !saving) void handleSubmit(onSubmit, onInvalid)()
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [isDirty, saving, handleSubmit, onSubmit, onInvalid])

    useEffect(() => {
        reset({ title: initial.title, code: initial.code, tags: initial.tags, language: initial.language })
    }, [initial.title, initial.code, initial.tags, initial.language, reset])

    return (
        <div className="space-y-3 h-full min-h-0 flex flex-col">
            <div className="flex gap-2">
                <Input {...register('title')} placeholder="Snippet title" />
                <Label className="whitespace-nowrap">
                    <span>TSX</span>
                    <Controller
                        control={control}
                        name="language"
                        render={({ field: { value, onChange } }) => (
                            <Switch checked={value === 'tsx'} onCheckedChange={(v) => onChange(v ? 'tsx' : 'ts')} />
                        )}
                    />
                </Label>
            </div>
            <div className="flex-1 min-h-0">
                <Controller
                    control={control}
                    name="code"
                    render={({ field: { value, onChange } }) => (
                        <TsEditor onChange={onChange} tsx={language === 'tsx'} value={value} />
                    )}
                />
            </div>
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <Controller
                        control={control}
                        name="tags"
                        render={({ field: { value, onChange } }) => (
                            <TagInput
                                onChange={onChange}
                                placeholder="Add a tag, then Enter / Tab / , "
                                value={value}
                            />
                        )}
                    />
                </div>
                <Button disabled={!isDirty || saving} onClick={handleSubmit(onSubmit, onInvalid)}>
                    {saving ? 'Saving…' : isNew ? 'Save' : 'Update'}
                    {!saving && (
                        <KbdGroup className="ml-2">
                            {isMac ? (
                                <>
                                    <Kbd>⌘</Kbd>
                                    <Kbd>S</Kbd>
                                </>
                            ) : (
                                <>
                                    <Kbd>Ctrl</Kbd>
                                    <Kbd>S</Kbd>
                                </>
                            )}
                        </KbdGroup>
                    )}
                </Button>
            </div>
        </div>
    )
}

// removed splitTags; TagInput maintains a string[]
