import { config } from "@/lib/config"
import { generateContent } from "@/services/inference/inference-service"
import { InferenceProvider } from "@/services/inference/schemas/provider-schema"
import { UIMessage, convertToModelMessages } from "ai"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

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

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    onFinish: async ({ responseMessage }) => {
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
