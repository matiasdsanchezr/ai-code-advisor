import "server-only"

import { InferenceRequestOptions } from "../../types/inference-request-options"
import { createOpenAI } from "@ai-sdk/openai"
import { Output, streamText, StreamTextResult, ToolSet } from "ai"

export class OpenAiClient {
  protected _openAI

  constructor(baseURL: string, apiKey: string) {
    this._openAI = createOpenAI({
      apiKey,
      baseURL,
    })
  }

  public generateContent = (
    params: InferenceRequestOptions
  ): StreamTextResult<ToolSet, never> => {
    const result = streamText({
      model: this._openAI(params.model),
      temperature: params.config?.temperature,
      topP: params.config?.topP,
      topK: params.config?.topK,
      system: params.system,
      messages: params.messages,
      output: params.responseJsonSchema
        ? Output.object(params.responseJsonSchema)
        : undefined,
    })

    return result
  }
}
