export interface ChatStreamResponse {
  answer: string
  sources: Array<{ title: string; url: string; name?: string }>
}

export interface ChatRequest {
  question: string
}

interface SourceItem {
  name?: string
  title?: string
  url?: string
}

interface AnswerPatch {
  op: string
  path: string
  value?: {
    answer?: string
    sources?: SourceItem[]
  }
}

interface AnswerTabsBlock {
  diff_block?: {
    patches?: AnswerPatch[]
  }
}

interface AskTextBlock {
  text?: string
}

interface Block {
  answer_tabs_block?: AnswerTabsBlock
  ask_text_block?: AskTextBlock
  answer?: string
  sources?: SourceItem[]
}

const API_ENDPOINT = 'https://mock-askperplexity.piyushhhxyz.deno.net'

/**
 * Extracts answer text from Perplexity API response blocks
 */
function extractAnswerFromBlocks(blocks: Block[]): string {
  if (!Array.isArray(blocks)) return ''

  for (const block of blocks) {
    // Check for answer_tabs_block with diff_block patches
    if (block.answer_tabs_block?.diff_block?.patches) {
      for (const patch of block.answer_tabs_block.diff_block.patches) {
        if (patch.value?.answer) {
          return patch.value.answer
        }
      }
    }

    // Check for direct answer field
    if (block.answer) {
      return block.answer
    }

    // Check for ask_text_block
    if (block.ask_text_block?.text) {
      return block.ask_text_block.text
    }
  }

  return ''
}

/**
 * Extracts sources from Perplexity API response blocks
 */
function extractSourcesFromBlocks(blocks: Block[]): Array<{
  title: string
  url: string
  name?: string
}> {
  if (!Array.isArray(blocks)) return []

  const sources: Array<{ title: string; url: string; name?: string }> = []

  for (const block of blocks) {
    // Check for answer_tabs_block with sources
    if (block.answer_tabs_block?.diff_block?.patches) {
      for (const patch of block.answer_tabs_block.diff_block.patches) {
        if (patch.value?.sources && Array.isArray(patch.value.sources)) {
          for (const source of patch.value.sources) {
            sources.push({
              title: source.name || source.title || source.url || 'Untitled',
              url: source.url || '',
              name: source.name,
            })
          }
        }
      }
    }

    // Check for direct sources field
    if (block.sources && Array.isArray(block.sources)) {
      for (const source of block.sources) {
        sources.push({
          title: source.name || source.title || source.url || 'Untitled',
          url: source.url || '',
          name: source.name,
        })
      }
    }
  }

  return sources
}

/**
 * Streams chat response from the API
 * @param question - The user's question
 * @param onChunk - Callback for each chunk of data received
 * @param onComplete - Callback when streaming is complete
 * @param onError - Callback for errors
 */
export async function streamChatResponse(
  question: string,
  onChunk: (chunk: string) => void,
  onComplete: (data: ChatStreamResponse) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullAnswer = ''
    let sources: Array<{ title: string; url: string; name?: string }> = []
    let isComplete = false

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // Process SSE format: event: message\ndata: {...}\n\n
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''

      for (const event of events) {
        if (!event.trim()) continue

        const lines = event.split('\n')
        let eventType = ''
        let eventData = ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            eventData = line.slice(6).trim()
          }
        }

        // Skip if no data
        if (!eventData || eventData === '[DONE]' || eventData === '{}') {
          continue
        }

        // Handle end_of_stream event
        if (eventType === 'end_of_stream') {
          isComplete = true
          continue
        }

        try {
          const parsed = JSON.parse(eventData)

          // Check if this is the final message
          if (
            parsed.final_sse_message === true ||
            parsed.status === 'COMPLETED'
          ) {
            isComplete = true
          }

          // Extract answer from blocks
          if (parsed.blocks && Array.isArray(parsed.blocks)) {
            const answer = extractAnswerFromBlocks(parsed.blocks)
            if (answer) {
              // Check if this is an incremental update
              if (
                answer.length >= fullAnswer.length &&
                answer.startsWith(fullAnswer)
              ) {
                // Incremental update
                fullAnswer = answer
                onChunk(fullAnswer)
              } else if (answer !== fullAnswer) {
                // New or different answer
                fullAnswer = answer
                onChunk(fullAnswer)
              }
            }

            // Extract sources from blocks
            const extractedSources = extractSourcesFromBlocks(parsed.blocks)
            if (extractedSources.length > 0) {
              sources = extractedSources
            }
          }

          // Fallback: check for direct answer field
          if (parsed.answer && typeof parsed.answer === 'string') {
            if (
              parsed.answer.length >= fullAnswer.length &&
              parsed.answer.startsWith(fullAnswer)
            ) {
              fullAnswer = parsed.answer
              onChunk(fullAnswer)
            } else if (parsed.answer !== fullAnswer) {
              fullAnswer = parsed.answer
              onChunk(fullAnswer)
            }
          }

          // Fallback: check for direct sources field
          if (parsed.sources && Array.isArray(parsed.sources)) {
            sources = parsed.sources.map((source: SourceItem) => ({
              title: source.name || source.title || source.url || 'Untitled',
              url: source.url || '',
              name: source.name,
            }))
          }
        } catch {
          // Skip invalid JSON - might be partial data
          continue
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim() && !isComplete) {
      try {
        const lines = buffer.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data && data !== '[DONE]' && data !== '{}') {
              const parsed = JSON.parse(data)
              if (parsed.blocks) {
                const answer = extractAnswerFromBlocks(parsed.blocks)
                if (answer) {
                  fullAnswer = answer
                  onChunk(fullAnswer)
                }
                const extractedSources = extractSourcesFromBlocks(parsed.blocks)
                if (extractedSources.length > 0) {
                  sources = extractedSources
                }
              }
            }
          }
        }
      } catch {
        // Ignore parse errors for remaining buffer
      }
    }

    onComplete({
      answer: fullAnswer,
      sources,
    })
  } catch (error) {
    onError(
      error instanceof Error ? error : new Error('Unknown error occurred')
    )
  }
}
