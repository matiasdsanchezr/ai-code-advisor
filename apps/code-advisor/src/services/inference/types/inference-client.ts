import { StreamTextResult, ToolSet } from "ai"
import { InferenceRequestOptions } from "./inference-request-options"

export type InferenceClient = {
  generateContent: (
    params: InferenceRequestOptions
  ) => StreamTextResult<ToolSet, never>
}
