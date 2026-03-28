Esta es una implementación de nivel de producción para habilitar el **Streaming de respuestas de IA** en tu aplicación Next.js 15/16.

El enfoque se basa en devolver un `Response` de Next.js con `Content-Type: text/plain` (o `text/event-stream` si prefieres SSE) y un `ReadableStream` que procesa los chunks de Google GenAI en tiempo real.

### 1. Análisis Técnico y Cambios Clave

1.  **Next.js `NextResponse`**: Usaremos `NextResponse.json` para errores y la construcción manual de un `Response` para el streaming exitoso.
2.  **`google-genai-client.ts`**: Modificaremos `generateResponseStream` para que no consuma todo el stream antes de retornar, sino que retorne el `AsyncGenerator` o procese el stream internamente y lo inyecte en el pipeline de respuesta. *Sin embargo*, para mantener la arquitectura de servicio limpia, la mejor práctica es que el cliente solo devuelva el flujo de datos y el Controlador (Route Handler) se encargue de la serialización HTTP.
3.  **`inference-service.ts`**: Actualizaremos para exponer el stream crudo.
4.  **`api/chat-completion.ts`**: Crearemos el endpoint que consume el stream, lo transforma en un `ReadableStream` de Node.js y lo envía al cliente.

### 2. Implementación

#### Paso 1: Actualizar `src/services/inference/api/google-genai/google-genai-client.ts`

El objetivo aquí es asegurar que el método `generateResponseStream` devuelva el `ReadableStream` o el `AsyncIterable` sin procesar completamente, permitiendo que el controlador lo gestione.

```tsx
// src/services/inference/api/google-genai/google-genai-client.ts
import "server-only";
import { config } from "@/lib/config";
import { type GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { type InferenceRequestOptions } from "../../types/inference-request-options";
import { InferenceResponse } from "../../types/inference-response";
import { defaultConfig } from "./google-genai-constants";
import { mapMessagesToGenAI } from "./google-genai-mapper";

export class GoogleGenAiClient {
  protected _client = new GoogleGenAI({ apiKey: config.GENAI_API_KEY });

  // ... (Método generateResponse existente se mantiene igual) ...

  /**
   * Genera una respuesta en streaming.
   * Retorna un objeto que contiene el stream procesado para ser consumido por el servidor.
   */
  public generateResponseStream = async (
    params: InferenceRequestOptions
  ): Promise<{ responseStream: AsyncGenerator<GenerateContentResponse, unknown, unknown> }> => {
    const model = params.model;
    const client = this._client;
    
    const contents = mapMessagesToGenAI({
      messages: params.messages,
      contextInfo: params.contextInfo,
    });

    try {
      const responseStream = await client.models.generateContentStream({
        model,
        contents,
        config: {
          ...defaultConfig,
          ...params.config,
          systemInstruction: params.systemPrompt,
          responseMimeType: params.responseJsonSchema ? "application/json" : "text/plain",
          responseJsonSchema: params.responseJsonSchema ? z.toJSONSchema(params.responseJsonSchema) : undefined,
        },
      });

      return { responseStream };
    } catch (error) {
      console.error("Error starting stream:", error);
      throw error;
    }
  };
}
```

#### Paso 2: Actualizar `src/services/inference/inference-service.ts`

Actualizamos el servicio para delegar la responsabilidad de la serialización al cliente, devolviendo el iterador del stream.

```ts
// src/services/inference/inference-service.ts
import { config } from "@/lib/config";
import { GeminiCliClient } from "./api/google-gemini-cli/google-gemini-cli-client";
import { GoogleGenAiClient } from "./api/google-genai/google-genai-client";
import { GoogleVertexClient } from "./api/google-vertex/google-vertex-client";
import { NvidiaNimClient } from "./api/nvidia-nim/nvidia-nim-client";
import { OpenRouterClient } from "./api/open-router/open-router-client";
import { InferenceProvider } from "./schemas/provider-schema";
import { InferenceClient } from "./types/inference-client";
import { InferenceRequestOptions } from "./types/inference-request-options";
import { GenerateContentResponse } from "@google/genai"; // Importación específica para tipado

// Mapeo de tipos para el streaming
export type StreamChunk = {
  content?: string;
  reasoning?: string;
  type: 'text' | 'reasoning' | 'error';
};

const clientCache = new Map<string, InferenceClient>();

function createClient(provider: InferenceProvider): InferenceClient {
  switch (provider) {
    case "genai":
      return new GoogleGenAiClient();
    case "geminiCli":
      return new GeminiCliClient();
    case "openRouter":
      return new OpenRouterClient();
    case "nvidiaNim":
      return new NvidiaNimClient();
    case "vertex":
      return new GoogleVertexClient();
    default:
      return new GoogleVertexClient();
  }
}

function getClient(provider: InferenceProvider): InferenceClient {
  const client = clientCache.get(provider);
  if (client) return client;
  const newClient = createClient(provider);
  clientCache.set(provider, newClient);
  return newClient;
}

// Mantenemos la función de respuesta completa para compatibilidad
export async function generateContent(requestOptions: InferenceRequestOptions) {
  const client = getClient(requestOptions.provider);
  if (!client.generateResponse) throw new Error("Método generateResponse no disponible");
  return client.generateResponse(requestOptions);
}

/**
 * Inicia el proceso de streaming.
 * Retorna el stream crudo del proveedor para que el route handler lo transforme en HTTP.
 */
export async function generateContentStreamingStream(
  requestOptions: InferenceRequestOptions
): Promise<AsyncGenerator<GenerateContentResponse, unknown, unknown>> {
  const client = getClient(requestOptions.provider);
  
  // Casting seguro ya que sabemos que GoogleGenAiClient implementa esto
  const typedClient = client as GoogleGenAiClient;
  
  if (!typedClient.generateResponseStream) {
    throw new Error("El proveedor seleccionado no soporta streaming nativo de la forma esperada.");
  }

  const result = await typedClient.generateResponseStream(requestOptions);
  return result.responseStream;
}
```

#### Paso 3: Crear la API Route `src/app/api/chat-completion/route.ts`

Este es el componente crítico. Convierte el `AsyncGenerator` de Google en un `ReadableStream` de Web que Next.js puede enviar al cliente.

```tsx
// src/app/api/chat-completion/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateContentStreamingStream, StreamChunk } from "@/services/inference/inference-service";
import { InferenceRequestOptions } from "@/services/inference/types/inference-request-options";
import { MessageSchema } from "@/services/inference/schemas/message.schema";

/**
 * POST /api/chat-completion
 * Maneja la solicitud de streaming de IA.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validación básica de entrada (puedes reforzar esto con Zod)
    const { 
      provider, 
      model, 
      systemPrompt, 
      messages, 
      contextInfo, 
      debug,
      responseJsonSchema,
      config 
    } = body;

    const options: InferenceRequestOptions = {
      provider,
      model,
      systemPrompt,
      messages,
      contextInfo,
      debug,
      responseJsonSchema,
      config: config || {},
    };

    // 1. Obtener el stream del servicio de inferencia
    const stream = await generateContentStreamingStream(options);

    // 2. Crear un ReadableStream de Web para enviar al cliente
    const responseStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullText = "";
        let fullReasoning = "";

        try {
          for await (const chunk of stream) {
            // Procesar chunks de Google GenAI
            const textPart = chunk.text || "";
            const thoughtPart = chunk.candidates?.[0]?.content?.parts?.[0]?.thought || "";

            if (textPart) {
              fullText += textPart;
              // Enviamos el chunk de texto inmediatamente
              const data: StreamChunk = {
                type: "text",
                content: textPart,
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            }

            if (thoughtPart) {
              fullReasoning += thoughtPart;
              // Opcional: Enviar reasoning si el frontend lo soporta
              const data: StreamChunk = {
                type: "reasoning",
                reasoning: thoughtPart,
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            }
          }

          // Fin del stream
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          console.error("Error en el stream:", error);
          const errorData: StreamChunk = {
            type: "error",
            content: "Error interno al generar la respuesta.",
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
          controller.close();
        }
      },
    });

    // 3. Retornar la respuesta con headers adecuados para streaming
    return new NextResponse(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        // Evitar buffering agresivo en algunos proxies
        "X-Accel-Buffering": "no", 
      },
    });
  } catch (error) {
    console.error("Error en API Chat Completion:", error);
    return NextResponse.json(
      { error: "Failed to start generation", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
```

### 3. Instrucciones de Uso en el Cliente (Frontend)

Para consumir este nuevo endpoint en tu componente `ChatShellContent`, deberás cambiar el enfoque de `useActionState` (que espera una respuesta completa) a una implementación manual de `fetch` con `ReadableStream`.

Sin embargo, dado que usas `Streamdown` y `useActionState`, la implementación más limpia sin romper la arquitectura actual sería:

1.  **Opción A (Recomendada - Pura Next.js)**: Crear una Server Action específica que haga el fetch al endpoint `/api/chat-completion` y maneje el stream.
2.  **Opción B (Directa)**: Modificar `chat-completion.tsx` para usar `fetch` directo a la API.

Aquí te dejo cómo deberías modificar tu `handleChatCompletion` en `chat-shell.tsx` para soportar el nuevo streaming:

```tsx
// Ejemplo de cómo consumir la nueva API en un componente Client
const [isWaitingForCompletion, setIsWaitingForCompletion] = useState(false);

const handleChatCompletionStream = async (formData: FormData) => {
  setIsWaitingForCompletion(true);
  
  const requestPayload = {
    provider: store.config.provider,
    model: store.config.model,
    systemPrompt: store.systemPrompt,
    messages: [
       // Construir mensajes aquí basado en store.userQuery y store.fileContents
       // Ejemplo simplificado:
       { role: "user", parts: [{ type: "text", content: store.userQuery }] }
    ],
    contextInfo: "", // Lógica para agregar contexto de archivos si es necesario
    config: { temperature: 0.7 },
  };

  const response = await fetch('/api/chat-completion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) throw new Error("Error en la conexión");

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let accumulatedText = "";
  let accumulatedReasoning = "";

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // Procesar las líneas "data: ..."
      const lines = chunk.split("\n");
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          
          try {
            const parsed: StreamChunk = JSON.parse(data);
            if (parsed.type === 'text' && parsed.content) {
              accumulatedText += parsed.content;
              // Actualizar estado incrementalmente (Recomendado con un Store o Ref)
              store.setAgentResponse({ ...store.agentResponse, response: accumulatedText });
            }
            if (parsed.type === 'reasoning' && parsed.reasoning) {
               // Opcional: Mostrar razonamiento
            }
          } catch (e) {
            // Ignorar líneas incompletas
          }
        }
      }
    }
  }
  
  setIsWaitingForCompletion(false);
};
```

### Resumen de Cambios

1.  **`google-genai-client.ts`**: Se modificó para retornar el `AsyncGenerator` directamente en lugar de consumirlo internamente.
2.  **`inference-service.ts`**: Se añadió `generateContentStreamingStream` para exponer el generador de forma tipada.
3.  **`api/chat-completion/route.ts`**: Se creó una nueva API Route que:
    *   Acepta JSON.
    *   Llama al servicio.
    *   Convierte el `AsyncGenerator` a un `ReadableStream`.
    *   Envía eventos formateados (`data: {...}`) al cliente.

Esta solución es totalmente compatible con Next.js 15/16, respeta la arquitectura de Server Components (la lógica de IA sigue en el servidor) y permite una experiencia de usuario fluida con texto apareciendo carácter por carácter.