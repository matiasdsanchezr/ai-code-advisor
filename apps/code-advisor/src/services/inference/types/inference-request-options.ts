import { ModelMessage } from "ai"
import { type ZodType } from "zod"
import { InferenceProvider } from "../schemas/provider-schema"

export type InferenceRequestOptions = {
  provider: InferenceProvider
  system?: string
  messages: ModelMessage[]
  model: string
  contextInfo?: string
  debug?: boolean
  responseJsonSchema?: ZodType
  signal?: AbortSignal
  config?: {
    temperature?: number
    topP?: number
    topK?: number
    maxOutputTokens?: number
  }
  enableThinking?: boolean
  includeThoughts?: boolean
  maxRetries?: number
}
