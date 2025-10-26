'use client'

import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Kbd, KbdGroup } from '@/components/ui/kbd'

type Props = {
    label?: string
    showShortcut?: boolean
    size?: 'sm' | 'default' | 'lg'
    className?: string
}

export default function NewSnippetButton({ label = 'New Snippet', showShortcut = true, size = 'sm', className }: Props) {
    const [isMac, setIsMac] = useState(false)
    useEffect(() => {
        const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform)
        setIsMac(mac)
    }, [])
    const onClick = () => {
        window.dispatchEvent(new CustomEvent('create-snippet'))
    }
    return (
        <Button className={className} onClick={onClick} size={size} type="button">
            <Plus className="size-4" />
            {label}
            {showShortcut && (
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
            )}
        </Button>
    )
}
