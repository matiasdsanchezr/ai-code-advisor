"use client"

import { InferenceProviderEnum } from "@/services/inference/schemas/provider-schema"
import {
  getModelsForProvider,
  InferenceModelSchema,
  type InferenceModel,
} from "@/services/inference/types/inference-model"
import { formatProviderName } from "@/services/inference/utils/model-formatter"
import { useChatStore } from "@/stores/chat-store"
import { useShallow } from "zustand/shallow"
import { NavSelector } from "./nav-selector"

export const ProviderMenu = () => {
  const { config, setConfig } = useChatStore(
    useShallow((s) => ({
      config: s.config,
      setConfig: s.setConfig,
    }))
  )

  const availableModels = getModelsForProvider(config.provider)
  const modelOptions = availableModels.map((m) => ({ label: m, value: m }))
  const providerOptions = InferenceProviderEnum.options.map((p) => ({
    label: formatProviderName(p),
    value: p,
  }))

  const handleProviderChange = (newProvider: string) => {
    const provider = InferenceProviderEnum.safeParse(newProvider)
    if (provider.error) {
      console.error("Proveedor inválido")
      return
    }
    const model = getModelsForProvider(provider.data)[0]
    const parsed = InferenceModelSchema.safeParse({
      provider: provider.data,
      model,
    })

    if (parsed.error) {
      console.error("Combinación de Proveedor y Modelo inválida")
      return
    }
    setConfig(parsed.data)
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-foreground">Proveedor</span>
        <NavSelector
          label="Proveedor"
          value={config.provider}
          options={providerOptions}
          onChange={handleProviderChange}
        />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-foreground">Modelo</span>
        <NavSelector
          label="Modelo"
          value={config.model}
          options={modelOptions}
          onChange={(val) =>
            setConfig({ ...config, model: val } as InferenceModel)
          }
        />
      </div>
    </>
  )
}
