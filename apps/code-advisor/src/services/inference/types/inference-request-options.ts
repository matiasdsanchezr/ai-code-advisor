import { ZodObject } from "zod"
import { InferenceProvider } from "../schemas/provider-schema"
import { ModelMessage } from "ai"

export type InferenceRequestOptions = {
  provider: InferenceProvider
  system?: string
  messages: ModelMessage[]
  model: string
  contextInfo?: string
  debug?: boolean
  responseJsonSchema?: ZodObject
  signal?: AbortSignal
  config?: {
    temperature?: number
    topP?: number
    topK?: number
    maxOutputTokens?: number
  }
}
