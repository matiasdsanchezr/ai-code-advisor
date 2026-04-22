import "server-only"

import {
  type GenerateTextResult,
  type StreamTextResult,
  type ToolSet,
  generateText as aiGenerateText,
  streamText as aiStreamText,
} from "ai"
import { type InferenceClient } from "../../types/inference-client"
import { type InferenceRequestOptions } from "../../types/inference-request-options"
import { jsonOutputInstruction } from "../../utils/json-output-instruction"
import { createOpenAI } from "@ai-sdk/openai"

export class OpenAiClient implements InferenceClient {
  protected _openAI

  constructor(baseURL: string, apiKey: string) {
    this._openAI = createOpenAI({
      apiKey,
      baseURL,
    })
  }

  public generateText = async (
    params: InferenceRequestOptions
  ): Promise<GenerateTextResult<ToolSet, never>> => {
    const system = params.responseJsonSchema
      ? jsonOutputInstruction(params.responseJsonSchema)
      : params.system
    const result = await aiGenerateText({
      model: this._openAI.chat(params.model),
      temperature: params.config?.temperature,
      topP: params.config?.topP,
      topK: params.config?.topK,
      maxRetries: params.maxRetries ?? 0,
      system,
      messages: params.messages,
      providerOptions: {
        nim: {
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
      model: this._openAI.chat(params.model),
      temperature: params.config?.temperature,
      topP: params.config?.topP,
      topK: params.config?.topK,
      maxRetries: params.maxRetries ?? 0,
      system,
      messages: params.messages,
      providerOptions: {
        nim: {
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
