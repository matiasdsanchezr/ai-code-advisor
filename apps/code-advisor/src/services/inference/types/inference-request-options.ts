import { InferenceProvider } from "../schemas/provider-schema"
import { FlexibleSchema, ModelMessage } from "ai"

export type InferenceRequestOptions = {
  provider: InferenceProvider
  system?: string
  messages: ModelMessage[]
  model: string
  contextInfo?: string
  debug?: boolean
  responseJsonSchema?: {
    schema: FlexibleSchema<unknown>
    name?: string | undefined
    description?: string | undefined
  }
  signal?: AbortSignal
  config?: {
    temperature?: number
    topP?: number
    topK?: number
    maxOutputTokens?: number
  }
  thinking?: boolean
}
