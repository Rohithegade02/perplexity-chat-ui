import * as React from 'react'
import { LeftIconGroup, RightIconGroup } from '@/components/molecules'
import { cn } from '@/lib/utils'
import { RefObject } from 'react'

interface ChatInputPresentationProps {
    contentEditableRef: RefObject<HTMLDivElement | null>
    onInput: () => void
    onCompositionStart: () => void
    onCompositionEnd: () => void
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
    placeholder?: string
    className?: string
}

const ChatInputPresentation = ({
    contentEditableRef,
    onInput,
    onCompositionStart,
    onCompositionEnd,
    onKeyDown,
    className,
    placeholder = 'Ask anything. Type @ for mentions.',
}: ChatInputPresentationProps) => {
    return (
        <div className={cn(className, "relative max-w-3xl w-full")}>
            <div className="relative  flex flex-col items-center gap-3 rounded-2xl border border-border  px-2 pb-3.5 shadow-sm transition-shadow focus-within:shadow-md">
                <div
                    ref={contentEditableRef}
                    className="overflow-auto max-h-[40vh w-[50vw] lg:max-h-[40vh] sm:max-h-[25vh] outline-none font-sans resize-none caret-super selection:bg-super/30 selection:text-foreground dark:selection:bg-super/10 dark:selection:text-super text-foreground bg-transparent placeholder-quieter placeholder:select-none scrollbar-subtle size-full min-h-[20px] px-2 py-2"
                    contentEditable
                    suppressContentEditableWarning
                    id="ask-input"
                    role="textbox"
                    spellCheck
                    data-lexical-editor="true"
                    style={{
                        userSelect: 'text',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}
                    onInput={onInput}
                    onCompositionStart={onCompositionStart}
                    onCompositionEnd={onCompositionEnd}
                    onKeyDown={onKeyDown}
                    data-placeholder={placeholder}
                />
                <div className="flex justify-between w-full">
                    <LeftIconGroup />
                    <RightIconGroup />
                </div>
            </div>
        </div>
    )
}

export default ChatInputPresentation
