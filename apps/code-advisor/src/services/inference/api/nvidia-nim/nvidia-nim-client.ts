import "server-only"

import { streamText, StreamTextResult, ToolSet } from "ai"
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
    queryParams: {
      thinking: "enabled",
    },
    transformRequestBody: (body) => {
      return {
        ...body,
        thinking: true,
        chat_template_kwargs: { thinking: true },
      }
    },
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
      providerOptions: {
        nim: {
          thinking: true,
        },
      },
    })

    return result
  }
}
