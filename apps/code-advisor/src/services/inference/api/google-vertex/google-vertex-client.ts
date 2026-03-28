import "server-only"

import { config } from "@/lib/config"
import { GoogleGenAI } from "@google/genai"

import { createVertex } from "@ai-sdk/google-vertex"
import { type GoogleLanguageModelOptions } from "@ai-sdk/google"
import { InferenceRequestOptions } from "../../types/inference-request-options"
import { streamText, StreamTextResult, ToolSet } from "ai"

export class GoogleVertexClient {
  vertex = createVertex({ apiKey: config.VERTEX_API_KEY })

  protected _client = new GoogleGenAI({
    vertexai: true,
    httpOptions: { apiVersion: "v1" },
    apiKey: config.VERTEX_API_KEY,
  })

  public generateContent = (
    params: InferenceRequestOptions
  ): StreamTextResult<ToolSet, never> => {
    const result = streamText({
      model: this.vertex(params.model),
      system: params.system,
      messages: params.messages,
      temperature: params.config?.temperature,
      topP: params.config?.topP,
      topK: params.config?.topK,
      maxOutputTokens: params.config?.maxOutputTokens,
      providerOptions: {
        vertex: {
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
          thinkingConfig: { includeThoughts: true, thinkingBudget: -1 },
        } satisfies GoogleLanguageModelOptions,
      },
    })

    return result
  }
}
