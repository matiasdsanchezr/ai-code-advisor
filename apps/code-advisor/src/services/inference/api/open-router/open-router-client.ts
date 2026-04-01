import "server-only"

import { config } from "@/lib/config"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { Output, streamText, StreamTextResult, ToolSet } from "ai"
import { InferenceRequestOptions } from "../../types/inference-request-options"

export class OpenRouterClient {
  private _nim = createOpenAICompatible({
    name: "openRouter",
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
      Authorization: `Bearer ${config.OPEN_ROUTER_API_KEY}`,
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
        openRouter: {
          thinking: true,
          clear_thinking: false,
          enable_thinking: true,
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
