"use client"

export const Navbar = () => {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900">
            <span className="icon-[mingcute--chat-4-ai-line] size-5"></span>
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-widest text-zinc-900 uppercase dark:text-zinc-100">
              Code Advisor
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Análisis de código inteligente
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
