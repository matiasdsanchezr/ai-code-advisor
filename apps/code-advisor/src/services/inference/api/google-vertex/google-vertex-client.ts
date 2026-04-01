import "server-only"

import { config } from "@/lib/config"
import { GoogleGenAI } from "@google/genai"

import { type GoogleLanguageModelOptions } from "@ai-sdk/google"
import { createVertex } from "@ai-sdk/google-vertex"
import { Output, streamText, StreamTextResult, ToolSet } from "ai"
import { type InferenceRequestOptions } from "../../types/inference-request-options"
import { genaiDefaultOptions } from "../google-genai/google-genai-client"

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
