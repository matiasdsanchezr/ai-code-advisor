import "server-only"

import { config } from "@/lib/config"
import {
  type GoogleLanguageModelOptions,
  createGoogleGenerativeAI,
} from "@ai-sdk/google"
import { Output, streamText, StreamTextResult, ToolSet } from "ai"
import { InferenceRequestOptions } from "../../types/inference-request-options"

export const genaiDefaultOptions: GoogleLanguageModelOptions = {
  safetySettings: [
    {
      category: "HARM_CATEGORY_CIVIC_INTEGRITY",
      threshold: "BLOCK_NONE",
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_NONE",
    },
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_NONE",
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_NONE",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_NONE",
    },
    {
      category: "HARM_CATEGORY_UNSPECIFIED",
      threshold: "BLOCK_NONE",
    },
  ],
}

export class GoogleGenAIClient {
  private _model = createGoogleGenerativeAI({ apiKey: config.GENAI_API_KEY })

  public generateContent = (
    params: InferenceRequestOptions
  ): StreamTextResult<ToolSet, never> => {
    const result = streamText({
      model: this._model(params.model),
      system: params.system,
      messages: params.messages,
      temperature: params.config?.temperature,
      topP: params.config?.topP,
      topK: params.config?.topK,
      maxOutputTokens: params.config?.maxOutputTokens,
      output: params.responseJsonSchema
        ? Output.object(params.responseJsonSchema)
        : undefined,
      providerOptions: {
        vertex: {
          ...genaiDefaultOptions,
          thinkingConfig: { includeThoughts: true, thinkingBudget: -1 },
        } satisfies GoogleLanguageModelOptions,
      },
    })

    return result
  }
}
