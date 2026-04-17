import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"

import { SystemPromptMenu } from "./system-prompt-menu"
import { loadPrompts } from "@/actions/prompt"
import { ProviderMenu } from "./provider-menu"

export async function SettingsDrawer() {
  const initialPrompts = await loadPrompts()

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="fixed top-3 right-4 z-50 h-10 w-10 rounded-full border-border/60 bg-background/80 shadow-sm backdrop-blur-md hover:bg-accent"
          >
            <span className="icon-[fa6-solid--gear] h-4 w-4 text-foreground/80" />
            <span className="sr-only">Configuración de LLM</span>
          </Button>
        }
      />

      <SheetContent className="flex w-[300px] flex-col gap-6 sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Configuración de Inferencia</SheetTitle>
          <SheetDescription>
            Ajusta el proveedor y el modelo de IA que se utilizarán para
            analizar el código y generar el prompt.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <ProviderMenu />
          <SystemPromptMenu availablePrompts={initialPrompts} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
