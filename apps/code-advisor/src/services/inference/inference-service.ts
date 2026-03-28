import { GeminiCliClient } from "./api/google-gemini-cli/google-gemini-cli-client"
import { GoogleGenAIClient } from "./api/google-genai/google-genai-client"
import { GoogleVertexClient } from "./api/google-vertex/google-vertex-client"
import { NvidiaNimClient } from "./api/nvidia-nim/nvidia-nim-client"
import { OpenRouterClient } from "./api/open-router/open-router-client"
import { InferenceProvider } from "./schemas/provider-schema"
import { InferenceClient } from "./types/inference-client"
import { InferenceRequestOptions } from "./types/inference-request-options"

const clientCache = new Map<string, InferenceClient>()

function createClient(provider: InferenceProvider) {
  switch (provider) {
    case "geminiCli":
      return new GeminiCliClient()
    case "nvidiaNim":
      return new NvidiaNimClient()
    case "openRouter":
      return new OpenRouterClient()
    case "vertex":
      return new GoogleVertexClient()
    case "genai":
      return new GoogleGenAIClient()
    default:
      return new GeminiCliClient()
  }
}

function getClient(provider: InferenceProvider): InferenceClient {
  const client = clientCache.get(provider)
  if (client) return client

  const newClient = createClient(provider)
  clientCache.set(provider, newClient)
  return newClient
}

export function generateContent(requestOptions: InferenceRequestOptions) {
  const client = getClient(requestOptions.provider)
  const modelResponse = client.generateContent(requestOptions)
  return modelResponse
}
