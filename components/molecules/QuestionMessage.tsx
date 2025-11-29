import * as React from 'react'
import { motion } from 'framer-motion'

interface QuestionMessageProps {
    content: string
    id: string
}

export const QuestionMessage = React.memo(({ content, id }: QuestionMessageProps) => {
    return (
        <motion.div
            id={id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="w-full flex justify-end max-w-3xl mx-auto px-4 py-6"
        >
            <div className="text-foreground  text-right text-base leading-relaxed whitespace-pre-wrap wrap-break-word">
                <p className='text-foreground w-fit text-right px-2.5 rounded-xl py-2.5 bg-[#f3f3ee]'>
                    {content}
                </p>
            </div>
        </motion.div>
    )
})

QuestionMessage.displayName = 'QuestionMessage'