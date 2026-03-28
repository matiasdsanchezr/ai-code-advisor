import { generateContent } from "@/services/inference/inference-service"
import { InferenceProvider } from "@/services/inference/schemas/provider-schema"
import { UIMessage, convertToModelMessages } from "ai"

export async function POST(req: Request) {
  const {
    provider,
    messages,
    model,
    system,
  }: {
    provider: InferenceProvider
    messages: UIMessage[]
    model: string
    system: string
  } = await req.json()

  const result = generateContent({
    messages: await convertToModelMessages(messages),
    model,
    system,
    provider,
    config: {},
  })

  return result.toUIMessageStreamResponse({ sendReasoning: true })
}
