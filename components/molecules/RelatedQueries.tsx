import React from 'react'
import { motion } from 'framer-motion'
import { RiCornerDownRightLine } from "@remixicon/react";

interface RelatedQueriesProps {
    queries: string[]
    onQueryClick?: (query: string) => void
}

export const RelatedQueries = React.memo(({ queries, onQueryClick }: RelatedQueriesProps) => {

    if (!queries || queries.length === 0) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-8 pt-6 border-t border-border"
        >
            <h3 className="text-sm font-medium text-foreground mb-4">Related</h3>
            <div className="space-y-0">
                {queries.map((query, index) => (
                    <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
                        onClick={() => onQueryClick?.(query)}
                        className="w-full flex items-center gap-2 px-0 py-3 text-left text-sm text-muted-foreground hover:text-foreground transition-colors border-b border-border last:border-b-0 group"
                    >
                        <div className="ml-xs duration-quick md:group-hover:text-super! inline-flex flex-none translate-y-px transition-all font-sans text-base font-medium text-foreground selection:bg-super/50 selection:text-foreground dark:selection:bg-super/10 dark:selection:text-super">
                            <RiCornerDownRightLine />
                        </div>
                        <span className="flex-1">{query}</span>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    )
})

RelatedQueries.displayName = 'RelatedQueries'

