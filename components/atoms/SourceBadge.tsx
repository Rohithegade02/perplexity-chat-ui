import React from "react";
import { motion } from 'framer-motion'


interface SourceBadgeProps {
    sources: Array<{ title: string; url: string }>
}


const SourceBadge = React.memo(({ sources }: SourceBadgeProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="mt-6 pt-6 border-t border-border"
        >
            <div className="text-sm text-muted-foreground mb-3">Sources:</div>
            <div className="flex flex-wrap gap-2">
                {sources?.map((source, index) => (
                    <motion.a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-accent transition-colors text-foreground"
                    >
                        {source.title}
                    </motion.a>
                ))}
            </div>
        </motion.div>)
});

SourceBadge.displayName = 'SourceBadge'

export default SourceBadge;
