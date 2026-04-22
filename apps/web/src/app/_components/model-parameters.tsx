"use client"

import { Input } from "@/components/ui/input"
import { useChatStore } from "@/stores/chat-store"
import { useShallow } from "zustand/shallow"

export const ModelParameters = () => {
  const { temperature, topP, setTemperature, setTopP } = useChatStore(
    useShallow((s) => ({
      temperature: s.temperature,
      topP: s.topP,
      setTemperature: s.setTemperature,
      setTopP: s.setTopP,
    }))
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Temperature Control */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Temperatura
          </span>
          <span className="font-mono text-sm text-muted-foreground">
            {temperature.toFixed(1)}
          </span>
        </div>
        <Input
          type="number"
          value={temperature}
          onChange={(e) =>
            setTemperature(Math.min(2, Math.max(0, Number(e.target.value))))
          }
          min={0}
          max={2}
          step={0.1}
        />
        <p className="text-xs text-muted-foreground">
          Controla la aleatoriedad. Valores bajos son más deterministas, altos
          más creativos.
        </p>
      </div>

      {/* Top P Control */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Top P (Nucleus Sampling)
          </span>
          <span className="font-mono text-sm text-muted-foreground">
            {topP.toFixed(2)}
          </span>
        </div>
        <Input
          type="number"
          value={topP}
          onChange={(e) =>
            setTopP(Math.min(1, Math.max(0, Number(e.target.value))))
          }
          min={0}
          max={1}
          step={0.01}
        />
        <p className="text-xs text-muted-foreground">
          Limita el muestreo a las palabras más probables. Un valor bajo hace el
          output más enfocado.
        </p>
      </div>
    </div>
  )
}
