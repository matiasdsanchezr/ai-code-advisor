import { config } from "@/lib/config"
import { streamText } from "@/services/inference/inference-service"
import { type InferenceProvider } from "@/services/inference/schemas/provider-schema"
import { type UIMessage, convertToModelMessages } from "ai"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

export async function POST(req: Request) {
  const {
    provider,
    messages,
    model,
    system,
    temperature,
    topP,
  }: {
    provider: InferenceProvider
    messages: UIMessage[]
    model: string
    system: string
    temperature: number
    topP: number
  } = await req.json()

  const result = streamText({
    system,
    messages: await convertToModelMessages(messages),
    model,
    provider,
    config: { temperature, topP },
  })

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    onFinish: async ({ responseMessage }) => {
      console.log(responseMessage.metadata)
      const outputPath = path.join(config.STORAGE_PATH, "outputs")
      await mkdir(outputPath, { recursive: true })
      await writeFile(
        path.join(outputPath, "last-response.md"),
        responseMessage.parts
          .map((p) => (p.type === "text" ? p.text : ""))
          .join("\n\n")
      )
    },
  })
}
