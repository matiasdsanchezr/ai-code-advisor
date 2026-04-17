import { generateTreeStructure } from "@/actions/get-file-tree"
import { Suspense } from "react"
import { ChatShellContent } from "./_components/chat-shell"
import { SettingsDrawer } from "./_components/settings-drawer"

export const ChatShell = async () => {
  const treeStructure = await generateTreeStructure()

  return (
    <ChatShellContent
      totalFiles={treeStructure.totalFiles}
      treeNodes={treeStructure.treeNodes}
    />
  )
}

export default function Home() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center gap-4 p-20 text-muted-foreground">
            <span className="icon-[fa6-solid--spinner] animate-spin text-4xl" />
            <p className="animate-pulse">Preparando entorno de análisis...</p>
          </div>
        }
      >
        <SettingsDrawer />
      </Suspense>

      <header className="flex flex-col items-center gap-1 border-b bg-muted/20 px-4 py-10">
        <div className="flex items-center gap-3">
          <span className="icon-[fa6-solid--magnifying-glass-code] text-4xl text-primary md:text-6xl" />
          <h1 className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-5xl">
            Code Advisor
          </h1>
        </div>
        <p className="max-w-2xl text-center text-sm text-muted-foreground md:text-lg">
          Analiza grafos de dependencias y optimiza tu código con IA
        </p>
      </header>

      <main className="container mx-auto max-w-550">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center gap-4 p-20 text-muted-foreground">
              <span className="icon-[fa6-solid--spinner] animate-spin text-4xl" />
              <p className="animate-pulse">Preparando entorno de análisis...</p>
            </div>
          }
        >
          <ChatShell />
        </Suspense>
      </main>
    </div>
  )
}
