import { defaultConfig } from "@/services/inference/api/google-genai/google-genai-constants";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { createGeminiProvider } from "ai-sdk-provider-gemini-cli";
import { z } from "zod";

export async function POST(req: Request) {
  const {
    messages,
    model,
    system,
    responseJsonSchema,
  }: {
    messages: UIMessage[];
    model: string;
    system: string;
    responseJsonSchema: z.ZodTypeAny;
  } = await req.json();

  console.log(model, system);

  const gemini = createGeminiProvider({
    authType: "oauth-personal",
  });

  const result = streamText({
    model: gemini(model, {
      ...defaultConfig,
      responseMimeType: responseJsonSchema ? "application/json" : "text/plain",
      responseJsonSchema: responseJsonSchema
        ? z.toJSONSchema(responseJsonSchema)
        : undefined,
    }),
    system: system,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
