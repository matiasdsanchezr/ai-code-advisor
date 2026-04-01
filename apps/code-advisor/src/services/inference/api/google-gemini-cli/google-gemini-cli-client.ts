import "server-only"

import { z, ZodObject } from "zod"

import { streamText, StreamTextResult, ToolSet } from "ai"
import { createGeminiProvider } from "ai-sdk-provider-gemini-cli"
import { InferenceRequestOptions } from "../../types/inference-request-options"
import { HarmBlockThreshold, HarmCategory } from "@google/genai"
import { GenerateContentConfig } from "@google/genai"

export type GeminiCliGenerationConfig = GenerateContentConfig & {
  responseModalities?: string[]
}

const defaultConfig: GeminiCliGenerationConfig = {
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ],
  temperature: 1,
  topP: 0.95,
  thinkingConfig: { includeThoughts: true, thinkingBudget: -1 },
  maxOutputTokens: 60000,
}

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
          ? z.toJSONSchema(params.responseJsonSchema.schema as ZodObject)
          : undefined,
      } satisfies GeminiCliGenerationConfig),
      system: params.system,
      messages: params.messages,
    })

    return result
  }
}
