"use client";

import { useEffect, RefObject } from "react";
import { Editor } from "@tiptap/react";

interface UsePasteHandlerOptions {
  editorRef: RefObject<Editor | null>;
  onPasteFiles: (files: File[]) => Promise<void> | void;
  enabled?: boolean;
}

/**
 * Hook to handle paste events on a TipTap editor, extracting and uploading image files
 * from clipboard data while preserving text paste functionality.
 */
export function usePasteHandler({
  editorRef,
  onPasteFiles,
  enabled = true,
}: UsePasteHandlerOptions) {
  useEffect(() => {
    if (!enabled) return;

    const editor = editorRef.current;
    if (!editor) return;

    const editorDom = editor.view.dom;
    if (!editorDom) return;

    const handlePaste = async (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      // Extract image files from clipboard
      const imageFiles: File[] = [];
      
      // Check clipboard items (for modern browsers)
      if (clipboardData.items) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              imageFiles.push(file);
            }
          }
        }
      }

      // Fallback: check files array
      if (imageFiles.length === 0 && clipboardData.files) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (file.type.startsWith("image/")) {
            imageFiles.push(file);
          }
        }
      }

      // If we found image files, upload them
      if (imageFiles.length > 0) {
        // Only prevent default if there's no text content to preserve
        const hasText = clipboardData.types.includes("text/plain");
        
        // Allow text to be pasted normally alongside images
        if (!hasText) {
          event.preventDefault();
        }

        await onPasteFiles(imageFiles);
      }
    };

    editorDom.addEventListener("paste", handlePaste);

    return () => {
      editorDom.removeEventListener("paste", handlePaste);
    };
  }, [editorRef, onPasteFiles, enabled]);
}
