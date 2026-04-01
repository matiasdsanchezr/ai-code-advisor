"use client"

import { useCallback, useMemo } from "react"
import { useChatStore } from "@/stores/chat-store"
import type { FileTreeNode } from "@/actions/get-file-tree"

interface UseFileSelectionOptions {
  treeNodes: FileTreeNode[]
}

export interface NodeState {
  checked: boolean
  indeterminate: boolean
}

export function useFileSelection({ treeNodes }: UseFileSelectionOptions) {
  const selectedFiles = useChatStore((state) => state.selectedFiles)
  const setSelectedFiles = useChatStore((state) => state.setSelectedFiles)

  // Construcción estable del mapa de carpetas a archivos
  const folderToFiles = useMemo(() => {
    const map = new Map<string, string[]>()

    const collectFiles = (node: FileTreeNode): string[] => {
      if (node.isFile) {
        return node.filePath ? [node.filePath] : []
      }

      const files = node.children.flatMap(collectFiles)
      if (files.length > 0) {
        map.set(node.id, files)
      }
      return files
    }

    treeNodes.forEach(collectFiles)
    return map
  }, [treeNodes])

  // Set memoizado para lookups O(1) en los componentes hijos
  const selectedSet = useMemo(() => new Set(selectedFiles), [selectedFiles])

  const toggleFile = useCallback(
    (node: FileTreeNode) => {
      if (node.isFile) {
        const filePath = node.filePath
        if (!filePath) return

        const isSelected = selectedSet.has(filePath)
        setSelectedFiles(
          isSelected
            ? selectedFiles.filter((f) => f !== filePath)
            : [...selectedFiles, filePath]
        )
      } else {
        const files = folderToFiles.get(node.id) ?? []
        if (files.length === 0) return

        const allSelected = files.every((f) => selectedSet.has(f))

        if (allSelected) {
          // Deseleccionar todos los archivos de esta carpeta
          setSelectedFiles(selectedFiles.filter((f) => !files.includes(f)))
        } else {
          // Seleccionar solo los archivos faltantes (diferencia simétrica)
          const newFiles = files.filter((f) => !selectedSet.has(f))
          setSelectedFiles([...selectedFiles, ...newFiles])
        }
      }
    },
    [selectedFiles, selectedSet, setSelectedFiles, folderToFiles]
  )

  const getNodeState = useCallback(
    (node: FileTreeNode): NodeState => {
      if (node.isFile) {
        return {
          checked: selectedSet.has(node.filePath ?? ""),
          indeterminate: false,
        }
      }

      const files = folderToFiles.get(node.id) ?? []
      if (files.length === 0) {
        return { checked: false, indeterminate: false }
      }

      const selectedCount = files.filter((f) => selectedSet.has(f)).length

      return {
        checked: selectedCount === files.length,
        indeterminate: selectedCount > 0 && selectedCount < files.length,
      }
    },
    [selectedSet, folderToFiles]
  )

  const selectAll = useCallback(() => {
    const allFiles: string[] = []

    const collect = (node: FileTreeNode) => {
      if (node.isFile && node.filePath) {
        allFiles.push(node.filePath)
      } else {
        node.children.forEach(collect)
      }
    }

    treeNodes.forEach(collect)
    setSelectedFiles(allFiles)
  }, [treeNodes, setSelectedFiles])

  const clearSelection = useCallback(() => {
    setSelectedFiles([])
  }, [setSelectedFiles])

  return {
    selectedFiles,
    selectedSet, // expuesto para optimizar renders en componentes hijos
    folderToFiles,
    toggleFile,
    getNodeState,
    selectAll,
    clearSelection,
    totalSelected: selectedFiles.length,
  }
}
