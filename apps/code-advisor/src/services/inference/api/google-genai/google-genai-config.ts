import { GoogleLanguageModelOptions } from "@ai-sdk/google"
import { InferenceRequestOptions } from "../../types/inference-request-options"

export const getThinkingConfig = (params: InferenceRequestOptions) => {
  if (params.enableThinking === undefined)
    return { includeThoughts: params.includeThoughts }

  const enableThinking = params.enableThinking
  const thinkingConfig: GoogleLanguageModelOptions["thinkingConfig"] = {
    includeThoughts: params.includeThoughts ?? true,
  }
  if (
    params.model === "gemini-2.5-pro" ||
    params.model === "gemini-2.5-flash"
  ) {
    thinkingConfig.thinkingBudget = enableThinking ? -1 : 0
  } else {
    thinkingConfig.thinkingLevel = enableThinking ? "high" : "minimal"
  }
  return thinkingConfig
}

export const googleDefaultOptions: GoogleLanguageModelOptions = {
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
}
