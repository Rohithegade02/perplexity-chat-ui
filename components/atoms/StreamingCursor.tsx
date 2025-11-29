import { motion } from 'framer-motion'
import { memo } from 'react'

const StreamingCursor = memo(({
    displayedContent,
    isStreaming,
}: {
    displayedContent: string
    isStreaming: boolean
}) => {
    return (
        <div>
            {displayedContent}
            {isStreaming && (
                <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="inline-block w-2 h-5 bg-foreground ml-1 align-middle"
                />
            )}
        </div>
    )
})

StreamingCursor.displayName = 'StreamingCursor'

export default StreamingCursor;
