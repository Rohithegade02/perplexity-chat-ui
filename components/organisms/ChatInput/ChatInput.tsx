'use client'

import * as React from 'react'
import ChatInputPresentation from './ChatInputPresentation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface ChatInputProps {
    onSubmit?: (message: string) => void
    className?: string
}

const ChatInput = ({ onSubmit, className }: ChatInputProps) => {
    const [value, setValue] = useState('')
    const contentEditableRef = useRef<HTMLDivElement>(null)
    const isComposingRef = useRef(false)

    // Sync React state to contentEditable
    useEffect(() => {
        if (
            contentEditableRef.current &&
            contentEditableRef.current.textContent !== value
        ) {
            contentEditableRef.current.textContent = value
        }
    }, [value])

    const handleInput = React.useCallback(() => {
        if (contentEditableRef.current && !isComposingRef.current) {
            const text = contentEditableRef.current.textContent || ''
            setValue(text)
        }
    }, [])

    const handleCompositionStart = useCallback(() => {
        isComposingRef.current = true
    }, [])

    const handleCompositionEnd = useCallback(() => {
        isComposingRef.current = false
        if (contentEditableRef.current) {
            const text = contentEditableRef.current.textContent || ''
            setValue(text)
        }
    }, [])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (value.trim()) {
                    const message = value.trim()
                    setValue('')
                    if (contentEditableRef.current) {
                        contentEditableRef.current.textContent = ''
                    }
                    if (onSubmit) {
                        onSubmit(message)
                    }
                }
            }
        },
        [value, onSubmit]
    )

    return (
        <ChatInputPresentation
            contentEditableRef={contentEditableRef}
            onInput={handleInput}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onKeyDown={handleKeyDown}
            className={className}
        />
    )
}

export default ChatInput
