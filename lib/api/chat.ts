export interface ChatStreamResponse {
  answer: string
  sources: Array<{ title: string; url: string; name?: string }>
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

interface MarkdownBlockValue {
  answer?: string
}

interface SourcesModeBlockValue {
  web_results?: WebResult[]
}

interface DiffBlockPatch {
  op: string
  path: string
  value?: MarkdownBlockValue | SourcesModeBlockValue | Record<string, unknown>
}

interface MarkdownBlock {
  progress?: string
  chunks?: string[]
  chunk_starting_offset?: number
  answer?: string
}

interface SourcesModeBlock {
  answer_mode_type?: string
  progress?: string
  web_results?: WebResult[]
  result_count?: number
  rows?: Array<{
    web_result: WebResult
    status?: string
    citation?: number
  }>
}

interface ParsedBlock {
  intended_usage?: string
  diff_block?: {
    field?: string
    patches?: DiffBlockPatch[]
  }
  markdown_block?: MarkdownBlock
  sources_mode_block?: SourcesModeBlock
}

const API_ENDPOINT = 'https://mock-askperplexity.piyushhhxyz.deno.net'

/**
 * Extracts answer text from Perplexity API response blocks
 * Based on actual API structure: blocks with intended_usage="ask_text" and diff_block.field="markdown_block"
 */
function extractAnswerFromBlocks(blocks: ParsedBlock[]): string {
  if (!Array.isArray(blocks)) {
    console.log('[extractAnswerFromBlocks] Blocks is not an array:', blocks)
    return ''
  }

  console.log('[extractAnswerFromBlocks] Processing blocks:', blocks.length)

  for (const block of blocks) {
    console.log('[extractAnswerFromBlocks] Block:', {
      intended_usage: block.intended_usage,
      field: block.diff_block?.field,
      hasPatches: !!block.diff_block?.patches,
      patchesLength: block.diff_block?.patches?.length || 0,
    })

    // Log the full patch structure for debugging
    if (block.diff_block?.patches && block.diff_block.patches.length > 0) {
      const patch = block.diff_block.patches[0]
      console.log('[extractAnswerFromBlocks] Patch details:', {
        op: patch.op,
        path: patch.path,
        valueKeys:
          patch.value && typeof patch.value === 'object'
            ? Object.keys(patch.value)
            : [],
        valueType: typeof patch.value,
        valuePreview:
          patch.value && typeof patch.value === 'object'
            ? JSON.stringify(patch.value).substring(0, 200)
            : String(patch.value).substring(0, 200),
      })
    }

    // Check for final response structure: intended_usage="ask_text" with markdown_block.answer directly
    if (
      block.intended_usage === 'ask_text' &&
      block.markdown_block?.answer &&
      typeof block.markdown_block.answer === 'string'
    ) {
      console.log(
        '[extractAnswerFromBlocks] Found ask_text block with markdown_block.answer:',
        {
          answerLength: block.markdown_block.answer.length,
          hasChunks: !!block.markdown_block.chunks,
          chunksLength: block.markdown_block.chunks?.length || 0,
        }
      )
      console.log(
        '[extractAnswerFromBlocks] Extracted answer from markdown_block:',
        block.markdown_block.answer.substring(0, 100) +
          (block.markdown_block.answer.length > 100 ? '...' : '')
      )
      return block.markdown_block.answer
    }

    // Check for streaming structure: intended_usage="ask_text" with diff_block.field="markdown_block"
    if (
      block.intended_usage === 'ask_text' &&
      block.diff_block?.field === 'markdown_block' &&
      block.diff_block.patches &&
      block.diff_block.patches.length > 0
    ) {
      const patch = block.diff_block.patches[0]
      const value = patch.value as MarkdownBlockValue | undefined
      console.log(
        '[extractAnswerFromBlocks] Found ask_text block with diff_block:',
        {
          patchOp: patch.op,
          patchPath: patch.path,
          hasAnswer: !!value?.answer,
          answerLength: value?.answer?.length || 0,
        }
      )
      if (value?.answer && typeof value.answer === 'string') {
        console.log(
          '[extractAnswerFromBlocks] Extracted answer from diff_block:',
          value.answer.substring(0, 100) +
            (value.answer.length > 100 ? '...' : '')
        )
        return value.answer
      }
    }

    // Also check for other possible answer locations
    // Sometimes the answer might be in the patch value directly with different structure
    if (block.diff_block?.patches && block.diff_block.patches.length > 0) {
      const patch = block.diff_block.patches[0]
      const value = patch.value as Record<string, unknown> | undefined

      // Check if value has an answer field (case-insensitive)
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const answerKey = Object.keys(value).find(
          (key) => key.toLowerCase() === 'answer'
        )
        if (answerKey && typeof value[answerKey] === 'string') {
          const answer = value[answerKey] as string
          console.log(
            '[extractAnswerFromBlocks] Found answer in alternative location:',
            answer.substring(0, 100) + (answer.length > 100 ? '...' : '')
          )
          return answer
        }
      }
    }
  }

  console.log('[extractAnswerFromBlocks] No answer found in blocks')
  return ''
}

/**
 * Extracts sources from Perplexity API response blocks
 * Based on actual API structure: blocks with intended_usage="sources_answer_mode" and diff_block.field="sources_mode_block"
 */
function extractSourcesFromBlocks(blocks: ParsedBlock[]): Array<{
  title: string
  url: string
  name?: string
}> {
  if (!Array.isArray(blocks)) {
    console.log('[extractSourcesFromBlocks] Blocks is not an array:', blocks)
    return []
  }

  const sources: Array<{ title: string; url: string; name?: string }> = []

  console.log('[extractSourcesFromBlocks] Processing blocks:', blocks.length)

  for (const block of blocks) {
    console.log('[extractSourcesFromBlocks] Block:', {
      intended_usage: block.intended_usage,
      field: block.diff_block?.field,
      hasPatches: !!block.diff_block?.patches,
      patchesLength: block.diff_block?.patches?.length || 0,
    })

    // Check for final response structure: intended_usage="sources_answer_mode" with sources_mode_block.web_results directly
    if (
      block.intended_usage === 'sources_answer_mode' &&
      block.sources_mode_block?.web_results &&
      Array.isArray(block.sources_mode_block.web_results)
    ) {
      console.log(
        '[extractSourcesFromBlocks] Found sources_answer_mode block with sources_mode_block.web_results:',
        {
          webResultsLength: block.sources_mode_block.web_results.length,
          resultCount: block.sources_mode_block.result_count,
        }
      )
      for (const source of block.sources_mode_block.web_results) {
        sources.push({
          title: source.name || source.title || source.url || 'Untitled',
          url: source.url || '',
          name: source.name,
        })
      }
      console.log(
        '[extractSourcesFromBlocks] Extracted sources from sources_mode_block:',
        sources.length
      )
    }

    // Check for streaming structure: intended_usage="sources_answer_mode" with diff_block.field="sources_mode_block"
    if (
      block.intended_usage === 'sources_answer_mode' &&
      block.diff_block?.field === 'sources_mode_block' &&
      block.diff_block.patches &&
      block.diff_block.patches.length > 0
    ) {
      const patch = block.diff_block.patches[0]
      const value = patch.value as SourcesModeBlockValue | undefined
      console.log(
        '[extractSourcesFromBlocks] Found sources_answer_mode block with diff_block:',
        {
          patchOp: patch.op,
          patchPath: patch.path,
          hasWebResults: !!value?.web_results,
          webResultsLength: value?.web_results?.length || 0,
        }
      )
      if (value?.web_results && Array.isArray(value.web_results)) {
        for (const source of value.web_results) {
          sources.push({
            title: source.name || source.title || source.url || 'Untitled',
            url: source.url || '',
            name: source.name,
          })
        }
        console.log(
          '[extractSourcesFromBlocks] Extracted sources from diff_block:',
          sources.length
        )
      }
    }
  }

  console.log(
    '[extractSourcesFromBlocks] Total sources extracted:',
    sources.length
  )
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
    console.log('[streamChatResponse] Starting request for question:', question)

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    })

    console.log(
      '[streamChatResponse] Response status:',
      response.status,
      response.statusText
    )

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
    let eventCount = 0

    console.log('[streamChatResponse] Starting to read stream...')

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        console.log('[streamChatResponse] Stream reading complete')
        break
      }

      buffer += decoder.decode(value, { stream: true })
      console.log(
        '[streamChatResponse] Received chunk, buffer length:',
        buffer.length
      )

      // Process SSE format: event: message\ndata: {...}\n\n
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''
      console.log(
        '[streamChatResponse] Split into events:',
        events.length,
        'remaining buffer:',
        buffer.length
      )

      for (const event of events) {
        if (!event.trim()) continue

        eventCount++
        console.log(`[streamChatResponse] Processing event #${eventCount}`)

        const lines = event.split('\n')
        let eventType = ''
        let eventData = ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim()
            console.log('[streamChatResponse] Event type:', eventType)
          } else if (line.startsWith('data: ')) {
            eventData = line.slice(6).trim()
            console.log(
              '[streamChatResponse] Event data length:',
              eventData.length
            )
          }
        }

        // Skip if no data
        if (!eventData || eventData === '[DONE]' || eventData === '{}') {
          console.log('[streamChatResponse] Skipping empty event data')
          continue
        }

        // Handle end_of_stream event
        if (eventType === 'end_of_stream') {
          console.log('[streamChatResponse] Received end_of_stream event')
          isComplete = true
          continue
        }

        try {
          const parsed = JSON.parse(eventData) as {
            blocks?: ParsedBlock[]
            final_sse_message?: boolean
            status?: string
            answer?: string
            sources?: WebResult[]
          }

          console.log('[streamChatResponse] Parsed JSON:', {
            hasBlocks: !!parsed.blocks,
            blocksLength: parsed.blocks?.length || 0,
            final_sse_message: parsed.final_sse_message,
            status: parsed.status,
            hasAnswer: !!parsed.answer,
            hasSources: !!parsed.sources,
          })

          // Check if this is the final message
          if (
            parsed.final_sse_message === true ||
            parsed.status === 'COMPLETED'
          ) {
            console.log('[streamChatResponse] Stream marked as complete')
            isComplete = true
          }

          // Extract answer from blocks
          if (parsed.blocks && Array.isArray(parsed.blocks)) {
            console.log(
              '[streamChatResponse] Extracting answer from',
              parsed.blocks.length,
              'blocks'
            )
            const answer = extractAnswerFromBlocks(parsed.blocks)
            if (answer) {
              console.log(
                '[streamChatResponse] Extracted answer length:',
                answer.length,
                'Current fullAnswer length:',
                fullAnswer.length,
                'Answer preview:',
                answer.substring(0, 50)
              )

              // Always update if answer is different (not just incremental)
              // This handles cases where the answer structure changes or is updated
              if (answer !== fullAnswer) {
                console.log(
                  '[streamChatResponse] Answer changed - updating. Old length:',
                  fullAnswer.length,
                  'New length:',
                  answer.length,
                  'Old preview:',
                  fullAnswer.substring(0, 50),
                  'New preview:',
                  answer.substring(0, 50)
                )
                fullAnswer = answer
                onChunk(fullAnswer)
              } else {
                console.log(
                  '[streamChatResponse] Answer unchanged, skipping chunk callback'
                )
              }
            } else {
              console.log(
                '[streamChatResponse] No answer extracted from blocks'
              )
            }

            // Extract sources from blocks
            console.log('[streamChatResponse] Extracting sources from blocks')
            const extractedSources = extractSourcesFromBlocks(parsed.blocks)
            if (extractedSources.length > 0) {
              console.log(
                '[streamChatResponse] Found',
                extractedSources.length,
                'sources'
              )
              sources = extractedSources
            }
          }

          // Fallback: check for direct answer field
          if (parsed.answer && typeof parsed.answer === 'string') {
            console.log(
              '[streamChatResponse] Found direct answer field, length:',
              parsed.answer.length
            )
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
            console.log(
              '[streamChatResponse] Found direct sources field, count:',
              parsed.sources.length
            )
            sources = parsed.sources.map((source) => ({
              title: source.name || source.title || source.url || 'Untitled',
              url: source.url || '',
              name: source.name,
            }))
          }
        } catch (error) {
          // Skip invalid JSON - might be partial data
          console.error('[streamChatResponse] Error parsing JSON:', error)
          console.error(
            '[streamChatResponse] Failed to parse data:',
            eventData.substring(0, 200)
          )
          continue
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim() && !isComplete) {
      console.log(
        '[streamChatResponse] Processing remaining buffer, length:',
        buffer.length
      )
      try {
        const lines = buffer.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data && data !== '[DONE]' && data !== '{}') {
              const parsed = JSON.parse(data) as { blocks?: ParsedBlock[] }
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
      } catch (error) {
        console.error(
          '[streamChatResponse] Error processing remaining buffer:',
          error
        )
      }
    }

    console.log(
      '[streamChatResponse] Stream complete. Final answer length:',
      fullAnswer.length,
      'Sources count:',
      sources.length
    )
    onComplete({
      answer: fullAnswer,
      sources,
    })
  } catch (error) {
    console.error('[streamChatResponse] Error in streamChatResponse:', error)
    onError(
      error instanceof Error ? error : new Error('Unknown error occurred')
    )
  }
}
