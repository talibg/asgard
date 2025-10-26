'use client'

import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Kbd, KbdGroup } from '@/components/ui/kbd'

export default function NewSnippetButton() {
    const [isMac, setIsMac] = useState(false)
    useEffect(() => {
        const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform)
        setIsMac(mac)
    }, [])
    const onClick = () => {
        window.dispatchEvent(new CustomEvent('create-snippet'))
    }
    return (
        <Button onClick={onClick} size="sm">
            <Plus className="size-4" />
            New Snippet
            <KbdGroup className="ml-2">
                {isMac ? (
                    <>
                        <Kbd>⌘</Kbd>
                        <Kbd>⌥</Kbd>
                        <Kbd>N</Kbd>
                    </>
                ) : (
                    <>
                        <Kbd>Ctrl</Kbd>
                        <Kbd>Alt</Kbd>
                        <Kbd>N</Kbd>
                    </>
                )}
            </KbdGroup>
        </Button>
    )
}
