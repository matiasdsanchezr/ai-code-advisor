import "server-only"

import { Output, streamText, StreamTextResult, ToolSet } from "ai"
import { InferenceRequestOptions } from "../../types/inference-request-options"
import { config } from "@/lib/config"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"

export class NvidiaNimClient {
  private _nim = createOpenAICompatible({
    name: "nim",
    baseURL: "https://integrate.api.nvidia.com/v1",
    headers: {
      Authorization: `Bearer ${config.NVIDIA_NIM_API_KEY}`,
    },
    includeUsage: true,
  })

  public generateContent = (
    params: InferenceRequestOptions
  ): StreamTextResult<ToolSet, never> => {
    const result = streamText({
      model: this._nim.chatModel(params.model),
      temperature: params.config?.temperature,
      topP: params.config?.topP,
      topK: params.config?.topK,
      system: params.system,
      messages: params.messages,
      output: params.responseJsonSchema
        ? Output.object(params.responseJsonSchema)
        : undefined,
      providerOptions: {
        nim: {
          chat_template_kwargs: {
            thinking: true,
            enable_thinking: true,
            clear_thinking: false,
          },
        },
      },
    })

    return result
  }
}
