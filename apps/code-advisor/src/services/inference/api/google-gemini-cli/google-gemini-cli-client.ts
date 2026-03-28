import "server-only"

import { z } from "zod"

import { defaultConfig } from "../google-genai/google-genai-constants"
import { streamText, StreamTextResult, ToolSet } from "ai"
import { createGeminiProvider } from "ai-sdk-provider-gemini-cli"
import { InferenceRequestOptions } from "../../types/inference-request-options"

export class GeminiCliClient {
  protected _gemini = createGeminiProvider({
    authType: "oauth-personal",
  })

  public generateContent = (
    params: InferenceRequestOptions
  ): StreamTextResult<ToolSet, never> => {
    const result = streamText({
      model: this._gemini(params.model, {
        ...defaultConfig,
        ...params.config,
        responseMimeType: params.responseJsonSchema
          ? "application/json"
          : "text/plain",
        responseJsonSchema: params.responseJsonSchema
          ? z.toJSONSchema(params.responseJsonSchema)
          : undefined,
      }),
      system: params.system,
      messages: params.messages,
    })

    return result
  }
}
