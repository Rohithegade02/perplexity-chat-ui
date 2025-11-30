'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QuestionMessage, AnswerMessage } from '@/components/molecules'
import { LoadingIndicator } from '@/components/atoms'
import { useChatStream } from '@/hooks/useChatStream'
import { useCallback, useEffect, useRef, useState } from 'react'
import ChatInput from '../ChatInput/ChatInput'

export interface Message {
    id: string
    type: 'question' | 'answer'
    content: string
    isStreaming?: boolean
    sources?: Array<{ title: string; url: string }>
    relatedQueries?: string[]
}

interface ChatProps {
    onSubmit?: (message: string) => void
}

const Chat = ({ onSubmit }: ChatProps) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [pendingQuestionScroll, setPendingQuestionScroll] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const questionRefs = useRef<Map<string, HTMLDivElement>>(new Map())
    const isScrollingRef = useRef(false)
    const currentAnswerIdRef = useRef<string | null>(null)
    const lastScrollTimeRef = useRef(0)

    console.log(messages, 'messages');


    const scrollToBottom = useCallback(() => {
        if (scrollContainerRef.current && !isScrollingRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth',
            })
        }
    }, [])

    // Scroll to question when it's rendered
    useEffect(() => {
        if (pendingQuestionScroll) {
            // Wait for next frame to ensure DOM is updated
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const questionElement = questionRefs.current.get(pendingQuestionScroll)
                    if (questionElement && scrollContainerRef.current && !isScrollingRef.current) {
                        isScrollingRef.current = true
                        // Calculate position relative to scroll container
                        const containerRect = scrollContainerRef.current.getBoundingClientRect()
                        const elementRect = questionElement.getBoundingClientRect()
                        const scrollTop = scrollContainerRef.current.scrollTop
                        const elementTop = scrollTop + elementRect.top - containerRect.top

                        // Scroll question to top of viewport (with small padding)
                        scrollContainerRef.current.scrollTo({
                            top: elementTop - 20,
                            behavior: 'smooth',
                        })

                        // Reset scrolling flag after animation
                        setTimeout(() => {
                            isScrollingRef.current = false
                        }, 500)
                    }
                    setPendingQuestionScroll(null)
                })
            })
        }
    }, [pendingQuestionScroll])

    const chatStream = useChatStream({
        onChunk: (chunk) => {
            console.log('chunk', chunk);

            if (currentAnswerIdRef.current) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === currentAnswerIdRef.current
                            ? {
                                ...msg,
                                content: chunk,
                                isStreaming: true,
                            }
                            : msg
                    )
                )

                // Auto-scroll during streaming (throttled for performance)
                const now = Date.now()
                if (now - lastScrollTimeRef.current > 50) {
                    requestAnimationFrame(() => {
                        scrollToBottom()
                    })
                    lastScrollTimeRef.current = now
                }
            }
        },
        onComplete: (data) => {
            if (currentAnswerIdRef.current) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === currentAnswerIdRef.current
                            ? {
                                ...msg,
                                content: data.answer,
                                isStreaming: false,
                                sources: data.sources || [],
                                relatedQueries: data.relatedQueries,
                            }
                            : msg
                    )
                )
                // Final scroll after sources appear
                setTimeout(() => {
                    scrollToBottom()
                }, 400)
                currentAnswerIdRef.current = null
            }
        },
        onError: (error) => {
            console.error('Chat stream error:', error)
            if (currentAnswerIdRef.current) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === currentAnswerIdRef.current
                            ? {
                                ...msg,
                                content: msg.content || 'Sorry, an error occurred while processing your request.',
                                isStreaming: false,
                            }
                            : msg
                    )
                )
                currentAnswerIdRef.current = null
            }
        },
    })

    const handleSubmit = useCallback(
        (message: string) => {
            if (!message.trim()) return

            const questionId = `question-${Date.now()}`
            const question: Message = {
                id: questionId,
                type: 'question',
                content: message,
            }

            setMessages((prev) => [...prev, question])

            // Set pending scroll - will be handled by useEffect when question is rendered
            setPendingQuestionScroll(questionId)

            // Create answer message
            const answerId = `answer-${Date.now()}`
            currentAnswerIdRef.current = answerId
            const answer: Message = {
                id: answerId,
                type: 'answer',
                content: '',
                isStreaming: true,
                sources: [],
            }

            setMessages((prev) => [...prev, answer])

            // Start streaming
            chatStream.mutate(message)

            if (onSubmit) {
                onSubmit(message)
            }
        },
        [onSubmit, chatStream]
    )

    // Auto-scroll when streaming answers update
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            if (lastMessage.type === 'answer' && lastMessage.isStreaming) {
                // Use a small delay to ensure DOM has updated
                const timeoutId = setTimeout(() => {
                    scrollToBottom()
                }, 10)
                return () => clearTimeout(timeoutId)
            }
        }
    }, [messages, scrollToBottom])

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
            >
                <AnimatePresence mode="popLayout">
                    {messages.length === 0 ? (
                        <motion.div
                            key="empty-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col  items-center justify-center h-full"
                        >
                            <div className="max-w-4xl  mx-auto">
                                <ChatInput className='max-w-3xl' onSubmit={handleSubmit} />
                            </div>
                        </motion.div>
                    ) : (
                        <React.Fragment>
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {message.type === 'question' ? (
                                        <div
                                            ref={(el) => {
                                                if (el) {
                                                    questionRefs.current.set(message.id, el)
                                                }
                                            }}
                                        >
                                            <QuestionMessage
                                                content={message.content}
                                                id={message.id}
                                            />
                                        </div>
                                    ) : (
                                        <AnswerMessage
                                            content={message.content}
                                            id={message.id}
                                            isStreaming={message.isStreaming}
                                            sources={message.sources}
                                            relatedQueries={message.relatedQueries}
                                            onRelatedQueryClick={handleSubmit}
                                        />
                                    )}
                                </motion.div>
                            ))}
                            {chatStream.isPending && <LoadingIndicator />}
                            <div ref={messagesEndRef} />
                        </React.Fragment>
                    )}
                </AnimatePresence>
            </div>

            {messages.length > 0 && <div className="sticky bottom-0  pt-4 pb-6 z-10">
                <div className="max-w-4xl mx-auto">
                    <ChatInput onSubmit={handleSubmit} />
                </div>
            </div>}
        </div>
    )
}

export default Chat

