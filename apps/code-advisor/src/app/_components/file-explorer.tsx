"use client"

import type { FileTreeNode } from "@/actions/get-file-tree"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFileSelection, type NodeState } from "@/hooks/use-file-selection"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { memo, useCallback, useMemo, useState } from "react"

interface FileExplorerProps {
  treeNodes: FileTreeNode[]
  totalFiles: number
  disabled?: boolean
}

// Componente memoizado para checkbox con estado indeterminado
const IndeterminateCheckbox = memo(function IndeterminateCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  className,
  disabled,
}: {
  checked: boolean
  indeterminate: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
  disabled?: boolean
}) {
  return (
    <Checkbox
      checked={indeterminate ? false : checked}
      indeterminate={indeterminate}
      onCheckedChange={(val) => onCheckedChange(!!val)}
      className={cn("h-5 w-5 shrink-0 md:h-4 md:w-4", className)}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
    />
  )
})

// Hook local para gestionar expansión de nodos (controlable y persistente)
function useTreeExpansion(initialExpanded?: Set<string>) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    initialExpanded ?? new Set()
  )

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  const isExpanded = useCallback(
    (nodeId: string) => expandedNodes.has(nodeId),
    [expandedNodes]
  )

  return { toggleExpand, isExpanded }
}

interface TreeNodeRowProps {
  node: FileTreeNode
  depth: number
  selectedSet: Set<string>
  folderToFiles: Map<string, string[]>
  onToggleSelection: (node: FileTreeNode) => void
  onToggleExpand: (nodeId: string) => void
  isExpanded: (nodeId: string) => boolean
  disabled: boolean
}

const TreeNodeRow = memo(function TreeNodeRow({
  node,
  depth,
  selectedSet,
  folderToFiles,
  onToggleSelection,
  onToggleExpand,
  isExpanded,
  disabled,
}: TreeNodeRowProps) {
  const expanded = isExpanded(node.id)

  const { checked, indeterminate } = useMemo<NodeState>(() => {
    if (node.isFile) {
      return {
        checked: selectedSet.has(node.filePath ?? ""),
        indeterminate: false,
      }
    }
    const files = folderToFiles.get(node.id) ?? []
    if (files.length === 0) return { checked: false, indeterminate: false }
    const selectedCount = files.filter((f) => selectedSet.has(f)).length
    return {
      checked: selectedCount === files.length,
      indeterminate: selectedCount > 0 && selectedCount < files.length,
    }
  }, [node, selectedSet, folderToFiles])

  const handleRowClick = useCallback(() => {
    if (!node.isFile) {
      onToggleExpand(node.id)
    } else {
      onToggleSelection(node)
    }
  }, [node, onToggleExpand, onToggleSelection])

  const handleCheckboxChange = useCallback(() => {
    onToggleSelection(node)
  }, [node, onToggleSelection])

  return (
    <li role="treeitem" aria-expanded={!node.isFile ? expanded : undefined}>
      <div className="group relative">
        <div
          onClick={handleRowClick}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-accent",
            "pl-[calc(var(--depth)*12px+8px)]"
          )}
          style={{ "--depth": depth } as React.CSSProperties}
        >
          {/* Chevron para carpetas */}
          <div className="flex h-4 w-4 items-center justify-center">
            {!node.isFile && (
              <span
                className={cn(
                  "icon-[fa7-solid--chevron-right] h-3 w-3 transition-transform duration-200",
                  expanded && "rotate-90"
                )}
              />
            )}
          </div>

          {/* Icono de tipo */}
          <span
            className={cn(
              "h-4 w-4 shrink-0",
              node.isFile
                ? "icon-[fa7-solid--file-code] opacity-50"
                : expanded
                  ? "icon-[fa7-solid--folder-open] text-yellow-500"
                  : "icon-[fa7-solid--folder] text-yellow-600"
            )}
          />

          {/* Nombre del nodo */}
          <span
            className={cn(
              "flex-1 truncate",
              !node.isFile && "font-medium text-foreground"
            )}
          >
            {node.name}
          </span>
        </div>

        {/* Checkbox */}
        <div
          className="absolute top-1/2 right-2 -translate-y-1/2 p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <IndeterminateCheckbox
            checked={checked}
            indeterminate={indeterminate}
            onCheckedChange={handleCheckboxChange}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Renderizado recursivo de hijos */}
      {expanded && node.children.length > 0 && (
        <ul className="mt-0.5 ml-4 border-l border-border/40 pl-1">
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedSet={selectedSet}
              folderToFiles={folderToFiles}
              onToggleSelection={onToggleSelection}
              onToggleExpand={onToggleExpand}
              isExpanded={isExpanded}
              disabled={disabled}
            />
          ))}
        </ul>
      )}
    </li>
  )
})

export function FileExplorer({
  treeNodes,
  totalFiles,
  disabled = false,
}: FileExplorerProps) {
  const {
    selectedFiles,
    selectedSet,
    folderToFiles,
    toggleFile,
    clearSelection,
    totalSelected,
  } = useFileSelection({
    treeNodes,
  })

  const { isExpanded, toggleExpand } = useTreeExpansion()
  const [activeTab, setActiveTab] = useState<"tree" | "selected">("tree")

  const sortedSelectedFiles = useMemo(() => {
    return [...selectedFiles].sort()
  }, [selectedFiles])

  return (
    <div className="flex flex-col gap-3">
      {/* Tabs móviles */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 md:hidden">
        <Button
          onClick={() => setActiveTab("tree")}
          variant={activeTab === "tree" ? "default" : "ghost"}
          className="flex-1 text-xs"
          size="sm"
        >
          <span className="icon-[fa7-solid--sitemap] mr-1.5 h-3.5 w-3.5" />
          Estructura
          <Badge variant="secondary" className="ml-1.5 text-[10px]">
            {totalFiles}
          </Badge>
        </Button>
        <Button
          onClick={() => setActiveTab("selected")}
          variant={activeTab === "selected" ? "default" : "ghost"}
          className="flex-1 text-xs"
          size="sm"
        >
          <span className="icon-[fa7-solid--square-check] mr-1.5 h-3.5 w-3.5" />
          Seleccionados
          <Badge variant="secondary" className="ml-1.5 text-[10px]">
            {totalSelected}
          </Badge>
        </Button>
      </div>

      {/* Layout principal */}
      <div className="flex min-h-[300px] flex-col overflow-hidden rounded-xl border bg-card md:h-[500px] md:flex-row">
        {/* Panel Izquierdo: Árbol */}
        <div
          className={cn(
            "flex flex-1 flex-col border-b md:w-1/2 md:border-r md:border-b-0 lg:w-2/5",
            activeTab === "tree" ? "flex" : "hidden md:flex"
          )}
        >
          <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="icon-[fa7-solid--sitemap] h-4 w-4" />
              Estructura de archivos
            </span>
            <Badge
              variant="secondary"
              className="hidden text-xs sm:inline-flex"
            >
              {totalFiles} archivos
            </Badge>
          </div>

          <ScrollArea className="flex-1 overflow-y-auto p-2">
            <ul
              className="space-y-0.5"
              role="tree"
              aria-label="Explorador de archivos"
            >
              {treeNodes.map((node) => (
                <TreeNodeRow
                  key={node.id}
                  node={node}
                  depth={0}
                  selectedSet={selectedSet}
                  folderToFiles={folderToFiles}
                  onToggleSelection={toggleFile}
                  onToggleExpand={toggleExpand}
                  isExpanded={isExpanded}
                  disabled={disabled}
                />
              ))}
            </ul>
          </ScrollArea>
        </div>

        {/* Panel Derecho: Seleccionados */}
        <div
          className={cn(
            "flex flex-1 flex-col md:w-1/2 lg:w-3/5",
            activeTab === "selected" ? "flex" : "hidden md:flex"
          )}
        >
          <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="icon-[fa7-solid--square-check] h-4 w-4" />
              Archivos seleccionados
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{totalSelected}</Badge>

              {selectedFiles.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:text-destructive md:h-auto md:w-auto md:px-2"
                        disabled={disabled}
                      >
                        <span className="icon-[fa7-solid--trash] h-4 w-4 md:mr-1.5" />
                        <span className="hidden text-xs md:inline">
                          Limpiar
                        </span>
                      </Button>
                    }
                  ></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Limpiar selección?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se deseleccionarán {selectedFiles.length} archivos. Esta
                        acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={clearSelection}
                        className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                      >
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1 overflow-y-auto p-3">
            {sortedSelectedFiles.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
                <span className="icon-[fa7-solid--arrow-pointer] h-8 w-8 opacity-50" />
                <p className="px-4 text-center text-sm">
                  Selecciona archivos o carpetas del explorador para comenzar
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {sortedSelectedFiles.map((file) => {
                  const parts = file.split("/")
                  const fileName = parts.pop() ?? file
                  const folderPath = parts.join("/")

                  return (
                    <li
                      key={file}
                      className="group relative flex flex-col gap-0.5 overflow-hidden rounded-md border bg-card p-2.5 transition-all hover:border-primary/20 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="icon-[fa7-solid--file-code] h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="flex-1 truncate text-[13px] font-medium">
                          {fileName}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                          onClick={() =>
                            toggleFile({
                              id: file,
                              name: fileName,
                              isFile: true,
                              filePath: file,
                              children: [],
                            })
                          }
                          disabled={disabled}
                          aria-label={`Eliminar ${fileName} de la selección`}
                        >
                          <span className="icon-[fa7-solid--xmark] h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {folderPath && (
                        <span
                          title={file}
                          className="truncate pl-5 font-mono text-[10px] text-muted-foreground"
                        >
                          {folderPath}/
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
