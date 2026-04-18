import "server-only"

import { config } from "@/lib/config"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import {
  type GenerateTextResult,
  type StreamTextResult,
  type ToolSet,
  generateText as aiGenerateText,
  streamText as aiStreamText,
} from "ai"
import { InferenceClient } from "../../types/inference-client"
import { type InferenceRequestOptions } from "../../types/inference-request-options"
import { jsonOutputInstruction } from "../../utils/json-output-instruction"

export class OpenRouterClient implements InferenceClient {
  private _nim = createOpenAICompatible({
    name: "openRouter",
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
      Authorization: `Bearer ${config.OPEN_ROUTER_API_KEY}`,
    },
    includeUsage: true,
  })

  public generateText = async (
    params: InferenceRequestOptions
  ): Promise<GenerateTextResult<ToolSet, never>> => {
    const system = params.responseJsonSchema
      ? jsonOutputInstruction(params.responseJsonSchema)
      : params.system
    const result = await aiGenerateText({
      model: this._nim.chatModel(params.model),
      temperature: params.config?.temperature,
      topP: params.config?.topP,
      topK: params.config?.topK,
      maxRetries: params.maxRetries ?? 0,
      system,
      messages: params.messages,
      providerOptions: {
        openRouter: {
          response_format: params.responseJsonSchema
            ? { type: "json_object" }
            : undefined,
          chat_template_kwargs: {
            thinking: params.enableThinking ?? true,
            enable_thinking: params.enableThinking ?? true,
            clear_thinking: !(params.includeThoughts ?? true),
          },
        },
      },
    })

    return result
  }

  public streamText = (
    params: InferenceRequestOptions
  ): StreamTextResult<ToolSet, never> => {
    const system = params.responseJsonSchema
      ? jsonOutputInstruction(params.responseJsonSchema)
      : params.system
    const result = aiStreamText({
      model: this._nim.chatModel(params.model),
      temperature: params.config?.temperature,
      topP: params.config?.topP,
      topK: params.config?.topK,
      maxRetries: params.maxRetries ?? 0,
      system,
      messages: params.messages,
      providerOptions: {
        openRouter: {
          response_format: params.responseJsonSchema
            ? { type: "json_object" }
            : undefined,
          chat_template_kwargs: {
            thinking: params.enableThinking ?? true,
            enable_thinking: params.enableThinking ?? true,
            clear_thinking: !(params.includeThoughts ?? true),
          },
        },
      },
    })

    return result
  }
}
