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

// Convert markdown to HTML with table support
function markdownToHtml(markdown: string): string {
    if (!markdown) return ''

    const lines = markdown.split('\n')
    const result: string[] = []
    let inTable = false
    let tableRows: string[][] = []
    let headerRow: string[] | null = null

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        const isTableRow = line.startsWith('|') && line.endsWith('|')
        const isTableSeparator = /^\|[\s\-:]+\|$/.test(line)

        if (isTableSeparator) {
            // This is the separator row, mark that we have a header
            if (tableRows.length > 0) {
                headerRow = tableRows[0]
                tableRows = tableRows.slice(1)
            }
            continue
        }

        if (isTableRow) {
            if (!inTable) {
                inTable = true
                tableRows = []
            }
            // Parse cells (remove first and last empty cells from split)
            const cells = line
                .split('|')
                .map(cell => cell.trim())
                .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
            tableRows.push(cells)
        } else {
            // End of table or regular text
            if (inTable && tableRows.length > 0) {
                result.push(renderTable(headerRow || tableRows[0], headerRow ? tableRows : tableRows.slice(1)))
                tableRows = []
                headerRow = null
                inTable = false
            }
            if (line) {
                result.push(escapeHtml(line))
            } else {
                result.push('<br>')
            }
        }
    }

    // Handle table at end
    if (inTable && tableRows.length > 0) {
        result.push(renderTable(headerRow || tableRows[0], headerRow ? tableRows : tableRows.slice(1)))
    }

    return result.join('')
}

function renderTable(header: string[], rows: string[][]): string {
    if (!header || header.length === 0) return ''

    let html = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-border rounded-lg overflow-hidden">'
    
    // Header
    html += '<thead><tr class="bg-muted/50">'
    header.forEach(cell => {
        html += `<th class="border border-border px-4 py-2 text-left font-semibold text-sm">${escapeHtml(cell)}</th>`
    })
    html += '</tr></thead>'

    // Body
    html += '<tbody>'
    rows.forEach((row, idx) => {
        html += `<tr class="${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}">`
        row.forEach(cell => {
            html += `<td class="border border-border px-4 py-2 text-sm">${escapeHtml(cell)}</td>`
        })
        html += '</tr>'
    })
    html += '</tbody></table></div>'

    return html
}

function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    }
    return text.replace(/[&<>"']/g, m => map[m])
}

export const AnswerMessage = memo(({
    content,
    id,
    isStreaming = false,
    sources = [],
}: AnswerMessageProps) => {
    const [displayedContent, setDisplayedContent] = useState('')

    useEffect(() => {
        // Always update displayedContent when content changes
        if (content) {
            setDisplayedContent(content)
        }
    }, [content])

    // Convert markdown to HTML
    const contentHtml = markdownToHtml(displayedContent)

    return (
        <motion.div
            id={id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-3xl mx-auto px-4 py-6"
        >
            <div 
                className="chat-message text-foreground text-base leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
            
            {isStreaming && (
                <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="inline-block w-2 h-5 bg-foreground ml-1 align-middle"
                />
            )}

            <AnimatePresence>
                {sources.length > 0 && (
                    <SourceBadge sources={sources} />
                )}
            </AnimatePresence>
        </motion.div>
    )
})

