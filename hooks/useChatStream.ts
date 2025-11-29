import { useMutation } from '@tanstack/react-query'
import { streamChatResponse, type ChatStreamResponse } from '@/lib/api/chat'

interface UseChatStreamOptions {
  onChunk?: (chunk: string) => void
  onComplete?: (data: ChatStreamResponse) => void
  onError?: (error: Error) => void
}

export function useChatStream(options: UseChatStreamOptions = {}) {
  const { onChunk, onComplete, onError } = options

  return useMutation({
    mutationFn: async (question: string) => {
      return new Promise<ChatStreamResponse>((resolve, reject) => {
        streamChatResponse(
          question,
          (chunk) => {
            onChunk?.(chunk)
          },
          (data) => {
            onComplete?.(data)
            resolve(data)
          },
          (error) => {
            onError?.(error)
            reject(error)
          }
        )
      })
    },
  })
}
