'use client'

import * as React from 'react'
import ChatInputPresentation from './ChatInputPresentation'

const ChatInput = () => {
    const [value, setValue] = React.useState('')
    const contentEditableRef = React.useRef<HTMLDivElement>(null)
    const isComposingRef = React.useRef(false)

    // Sync React state to contentEditable
    React.useEffect(() => {
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

    const handleCompositionStart = React.useCallback(() => {
        isComposingRef.current = true
    }, [])

    const handleCompositionEnd = React.useCallback(() => {
        isComposingRef.current = false
        if (contentEditableRef.current) {
            const text = contentEditableRef.current.textContent || ''
            setValue(text)
        }
    }, [])

    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (value.trim()) {
                    // Handle submit logic here
                    console.log('Submitting:', value)
                    setValue('')
                }
            }
        },
        [value]
    )

    return (
        <ChatInputPresentation
            contentEditableRef={contentEditableRef}
            onInput={handleInput}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onKeyDown={handleKeyDown}
        />
    )
}

export default ChatInput
