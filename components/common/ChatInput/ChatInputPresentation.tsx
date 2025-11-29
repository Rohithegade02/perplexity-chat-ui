import * as React from 'react'
import { LeftIconGroup } from './LeftIconGroup'
import { RightIconGroup } from './RightIconGroup'

interface ChatInputPresentationProps {
    contentEditableRef: React.RefObject<HTMLDivElement | null>
    onInput: () => void
    onCompositionStart: () => void
    onCompositionEnd: () => void
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
    placeholder?: string
}

const ChatInputPresentation = ({
    contentEditableRef,
    onInput,
    onCompositionStart,
    onCompositionEnd,
    onKeyDown,
    placeholder = 'Ask anything. Type @ for mentions.',
}: ChatInputPresentationProps) => {
    return (
        <div className="relative w-full max-w-3xl">
            <div className="relative flex flex-col items-center gap-3 rounded-2xl border border-border bg-background px-2 pb-3.5 shadow-sm transition-shadow focus-within:shadow-md">
                <div
                    ref={contentEditableRef}
                    className="overflow-auto max-h-[40vh] lg:max-h-[40vh] sm:max-h-[25vh] outline-none font-sans resize-none caret-super selection:bg-super/30 selection:text-foreground dark:selection:bg-super/10 dark:selection:text-super text-foreground bg-transparent placeholder-quieter placeholder:select-none scrollbar-subtle size-full min-h-[20px] px-2 py-2"
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
