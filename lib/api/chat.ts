export interface ChatStreamResponse {
  answer: string
  sources: Array<{ title: string; url: string; name?: string }>
  relatedQueries?: string[]
}

export interface ChatRequest {
  question: string
}

interface WebResult {
  name?: string
  title?: string
  url?: string
  snippet?: string
}

interface DiffBlockPatch {
  op: string
  path: string
  value?: string | Record<string, unknown>
}

interface ParsedBlock {
  intended_usage?: string
  diff_block?: {
    field?: string
    patches?: DiffBlockPatch[]
  }
  markdown_block?: {
    answer?: string
  }
  sources_mode_block?: {
    web_results?: WebResult[]
    rows?: Array<{
      web_result: WebResult
      status?: string
    }>
  }
}

const API_ENDPOINT = 'https://mock-askperplexity.piyushhhxyz.deno.net'

/**
 * Extracts answer text from ask_text blocks
 * Looks for patches with op="replace" and path="/answer"
 */
function extractAnswerFromBlocks(blocks: ParsedBlock[]): string {
  if (!Array.isArray(blocks)) return ''

  for (const block of blocks) {
    // Look for ask_text blocks with markdown_block patches
    if (
      block.intended_usage === 'ask_text' &&
      block.diff_block?.field === 'markdown_block' &&
      block.diff_block.patches
    ) {
      // Find patch that replaces /answer
      for (const patch of block.diff_block.patches) {
        if (patch.op === 'replace' && patch.path === '/answer') {
          // The value is the full answer text
          if (typeof patch.value === 'string') {
            return patch.value
          }
          // Sometimes value is an object with answer field
          if (
            patch.value &&
            typeof patch.value === 'object' &&
            'answer' in patch.value &&
            typeof patch.value.answer === 'string'
          ) {
            return patch.value.answer
          }
        }
      }
    }

    // Fallback: check markdown_block directly (final response)
    if (
      block.intended_usage === 'ask_text' &&
      block.markdown_block?.answer &&
      typeof block.markdown_block.answer === 'string'
    ) {
      return block.markdown_block.answer
    }
  }

  return ''
}

/**
 * Extracts sources from sources_mode blocks
 */
function extractSourcesFromBlocks(blocks: ParsedBlock[]): Array<{
  title: string
  url: string
  name?: string
}> {
  if (!Array.isArray(blocks)) return []

  const sources: Array<{ title: string; url: string; name?: string }> = []

  for (const block of blocks) {
    // Check sources_mode_block directly
    if (
      block.intended_usage === 'sources_answer_mode' &&
      block.sources_mode_block?.web_results
    ) {
      for (const source of block.sources_mode_block.web_results) {
        sources.push({
          title: source.name || source.title || source.url || 'Untitled',
          url: source.url || '',
          name: source.name,
        })
      }
    }

    // Check sources_mode_block from patches
    if (
      block.intended_usage === 'sources_answer_mode' &&
      block.diff_block?.field === 'sources_mode_block' &&
      block.diff_block.patches
    ) {
      for (const patch of block.diff_block.patches) {
        if (
          patch.value &&
          typeof patch.value === 'object' &&
          'web_results' in patch.value &&
          Array.isArray(patch.value.web_results)
        ) {
          for (const source of patch.value.web_results as WebResult[]) {
            sources.push({
              title: source.name || source.title || source.url || 'Untitled',
              url: source.url || '',
              name: source.name,
            })
          }
        }
      }
    }
  }

  return sources
}

/**
 * Streams chat response from the API
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
    let relatedQueries: string[] = []

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Process SSE format: event: message\ndata: {...}\n\n
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''

      for (const event of events) {
        if (!event.trim()) continue

        const lines = event.split('\n')
        let eventData = ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            eventData = line.slice(6).trim()
          }
        }

        // Skip empty data
        if (!eventData || eventData === '[DONE]' || eventData === '{}') {
          continue
        }

        try {
          const parsed = JSON.parse(eventData) as {
            blocks?: ParsedBlock[]
            final_sse_message?: boolean
            status?: string
            related_queries?: string[]
            related_query_items?: Array<{ text: string; type?: string }>
          }

          // Extract answer from blocks
          if (parsed.blocks && Array.isArray(parsed.blocks)) {
            const answer = extractAnswerFromBlocks(parsed.blocks)
            if (answer && answer !== fullAnswer) {
              fullAnswer = answer
              onChunk(fullAnswer)
            }

            // Extract sources from blocks
            const extractedSources = extractSourcesFromBlocks(parsed.blocks)
            if (extractedSources.length > 0) {
              sources = extractedSources
            }
          }

          // Extract related queries (check both formats)
          if (
            parsed.related_query_items &&
            Array.isArray(parsed.related_query_items)
          ) {
            relatedQueries = parsed.related_query_items.map((item) => item.text)
            console.log(
              '[streamChatResponse] Extracted related_query_items:',
              relatedQueries
            )
          } else if (
            parsed.related_queries &&
            Array.isArray(parsed.related_queries)
          ) {
            relatedQueries = parsed.related_queries
            console.log(
              '[streamChatResponse] Extracted related_queries:',
              relatedQueries
            )
          }

          // Check if stream is complete AFTER processing data
          if (
            parsed.final_sse_message === true ||
            parsed.status === 'COMPLETED'
          ) {
            break
          }
        } catch {
          // Skip invalid JSON - might be partial data
          continue
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      try {
        const lines = buffer.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data && data !== '[DONE]' && data !== '{}') {
              console.log('chat data', data)

              const parsed = JSON.parse(data) as {
                blocks?: ParsedBlock[]
                related_queries?: string[]
                related_query_items?: Array<{ text: string; type?: string }>
              }
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

              // Extract related queries from remaining buffer
              if (
                parsed.related_query_items &&
                Array.isArray(parsed.related_query_items)
              ) {
                relatedQueries = parsed.related_query_items.map(
                  (item) => item.text
                )
                console.log(
                  '[streamChatResponse] Extracted related_query_items from buffer:',
                  relatedQueries
                )
              } else if (
                parsed.related_queries &&
                Array.isArray(parsed.related_queries)
              ) {
                relatedQueries = parsed.related_queries
                console.log(
                  '[streamChatResponse] Extracted related_queries from buffer:',
                  relatedQueries
                )
              }
            }
          }
        }
      } catch {
        // Ignore parsing errors in remaining buffer
      }
    }

    onComplete({
      answer: fullAnswer,
      sources,
      relatedQueries: relatedQueries.length > 0 ? relatedQueries : undefined,
    })
  } catch (error) {
    onError(
      error instanceof Error ? error : new Error('Unknown error occurred')
    )
  }
}
