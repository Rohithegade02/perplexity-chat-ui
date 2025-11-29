import { motion, AnimatePresence } from 'framer-motion'
import { memo, useEffect, useState } from 'react'
import { SourceBadge } from '@/components/atoms'
import { StreamingCursor } from '@/components/atoms'

interface AnswerMessageProps {
    content: string
    id: string
    isStreaming?: boolean
    sources?: Array<{ title: string; url: string }>
}

export const AnswerMessage = memo(({
    content,
    id,
    isStreaming = false,
    sources = [],
}: AnswerMessageProps) => {
    const [displayedContent, setDisplayedContent] = useState('')

    useEffect(() => {
        if (isStreaming) {
            // setDisplayedContent(content)
        } else if (content && !isStreaming) {
            // Only animate if content changed and not streaming
            // setDisplayedContent(content)
        }
    }, [content, isStreaming])

    return (
        <motion.div
            id={id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-3xl mx-auto px-4 py-6"
        >
            <div className="chat-message text-foreground text-base leading-relaxed whitespace-pre-wrap wrap-break-word">
                <StreamingCursor displayedContent={displayedContent} isStreaming={isStreaming} />
            </div>

            <AnimatePresence>
                {sources.length > 0 && (
                    <SourceBadge sources={sources} />
                )}
            </AnimatePresence>
        </motion.div>
    )
})

