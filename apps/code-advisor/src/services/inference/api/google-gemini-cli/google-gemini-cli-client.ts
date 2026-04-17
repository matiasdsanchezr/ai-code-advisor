import {
  type GenerateTextResult,
  Output,
  type StreamTextResult,
  type ToolSet,
  generateText as aiGenerateText,
  streamText as aiStreamText,
} from "ai"
import { createGeminiProvider } from "ai-sdk-provider-gemini-cli"
import "server-only"
import { InferenceClient } from "../../types/inference-client"
import { InferenceRequestOptions } from "../../types/inference-request-options"
import {
  getThinkingConfig,
  googleDefaultOptions,
} from "../google-genai/google-genai-config"

export class GeminiCliClient implements InferenceClient {
  protected geminiProvider = createGeminiProvider({
    authType: "oauth-personal",
  })

  public generateText = async (
    params: InferenceRequestOptions
  ): Promise<GenerateTextResult<ToolSet, never>> => {
    const thinkingConfig = getThinkingConfig(params)
    const result = aiGenerateText({
      model: this.geminiProvider(params.model, {
        ...googleDefaultOptions,
        ...params.config,
        thinkingConfig,
      }),
      system: params.system,
      messages: params.messages,
      maxRetries: params.maxRetries ?? 0,
      output: params.responseJsonSchema
        ? Output.object({ schema: params.responseJsonSchema })
        : undefined,
    })

    return result
  }

  public streamText = (
    params: InferenceRequestOptions
  ): StreamTextResult<ToolSet, never> => {
    const thinkingConfig = getThinkingConfig(params)
    const result = aiStreamText({
      model: this.geminiProvider(params.model, {
        ...googleDefaultOptions,
        ...params.config,
        thinkingConfig,
      }),
      system: params.system,
      messages: params.messages,
      maxRetries: params.maxRetries ?? 0,
      output: params.responseJsonSchema
        ? Output.object({ schema: params.responseJsonSchema })
        : undefined,
    })

    return result
  }
}
