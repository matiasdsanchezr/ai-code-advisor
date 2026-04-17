import "server-only"

import { config } from "@/lib/config"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import {
  type GenerateTextResult,
  type StreamTextResult,
  type ToolSet,
  Output,
  generateText as aiGenerateText,
  streamText as aiStreamText,
} from "ai"
import z from "zod"
import { InferenceClient } from "../../types/inference-client"
import { type InferenceRequestOptions } from "../../types/inference-request-options"
import { jsonOutputInstruction } from "../../utils/json-output-instruction"

export class NvidiaNimClient implements InferenceClient {
  private _nim = createOpenAICompatible({
    name: "nim",
    baseURL: "https://integrate.api.nvidia.com/v1",
    headers: {
      Authorization: `Bearer ${config.NVIDIA_NIM_API_KEY}`,
    },
    includeUsage: true,
  })

  public generateText = async (
    params: InferenceRequestOptions
  ): Promise<GenerateTextResult<ToolSet, never>> => {
    let system = params.system ?? ""
    if (params.responseJsonSchema) {
      const outputInstruction = jsonOutputInstruction(
        JSON.stringify(z.toJSONSchema(params.responseJsonSchema))
      )
      system = system.concat(outputInstruction)
    }
    const result = await aiGenerateText({
      model: this._nim.chatModel(params.model),
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
            clear_thinking: !(params.includeThoughts ?? false),
          },
        },
      },
    })

    return result
  }

  public streamText = (
    params: InferenceRequestOptions
  ): StreamTextResult<ToolSet, never> => {
    let system = params.system ?? ""
    if (params.responseJsonSchema) {
      const outputInstruction = jsonOutputInstruction(
        JSON.stringify(z.toJSONSchema(params.responseJsonSchema))
      )
      system = system.concat(outputInstruction)
    }
    const result = aiStreamText({
      model: this._nim.chatModel(params.model),
      temperature: params.config?.temperature,
      topP: params.config?.topP,
      topK: params.config?.topK,
      maxRetries: params.maxRetries ?? 0,
      output: params.responseJsonSchema ? Output.json() : undefined,
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
            clear_thinking: !(params.includeThoughts ?? false),
          },
        },
      },
    })

    return result
  }
}
