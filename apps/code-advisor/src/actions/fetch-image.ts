import { ActionState } from "@/types/action-state"

export type ImageFile = {
  mimeType: string
  content: string
}

export const fetchImage = async (src: string): Promise<ImageFile> => {
  const response = await fetch(src)
  if (!response.ok) throw new Error(`Error al cargar la imagen con url ${src}`)

  const mime =
    response.headers.get("content-type") || response.headers.get("Content-Type")

  if (!mime || !mime.startsWith("image/"))
    throw new Error(`Error al cargar la imagen, MIME invalido. Url: ${src}`)

  const imageArrayBuffer = await response.arrayBuffer()
  const base64ImageData = Buffer.from(imageArrayBuffer).toString("base64")
  return { mimeType: mime, content: base64ImageData }
}

export async function getImageFiles(
  _prevState: ActionState<string[]>,
  formData: FormData
): Promise<ActionState<ImageFile[]>> {
  try {
    const imgSrcs = formData.get("imageUrls") as string
    if (!imgSrcs || imgSrcs.trim() === "") {
      return {}
    }

    const urls = imgSrcs
      .split(",")
      .map((src) => src.trim())
      .filter((src) => src.length > 0)

    const base64Images = await Promise.all(urls.map((src) => fetchImage(src)))

    return { data: base64Images }
  } catch (e: unknown) {
    console.error("Error al procesar imágenes:", e)
    return {
      error: "Error al obtener o procesar las imágenes proporcionadas",
    }
  }
}
