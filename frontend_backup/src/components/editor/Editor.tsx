"use client";

import React, { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder as placeholderExt } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
    autocompletion,
    closeBrackets,
    closeBracketsKeymap,
    completionKeymap,
} from "@codemirror/autocomplete";
import { markdown } from "@codemirror/lang-markdown";
import { indentOnInput, bracketMatching } from "@codemirror/language";
import { languages } from "@codemirror/language-data";

// Import our custom extensions
import { wikiLinkPlugin, wikiLinkAutocomplete } from "./WikiLinkExtension";
import "../../styles/editor.css"; // Ensure you import the styles

interface EditorProps {
    initialValue?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
}

export const MarkdownEditor: React.FC<EditorProps> = ({
    initialValue = "",
    onChange,
    placeholder = "Start typing [[ to link a note...",
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;

        // Define the initial state with all extensions
        const startState = EditorState.create({
            doc: initialValue,
            extensions: [
                // 1. Basics
                history(),
                bracketMatching(),
                closeBrackets(),
                indentOnInput(),
                placeholderExt(placeholder),

                // 2. Keymaps
                keymap.of([
                    ...closeBracketsKeymap,
                    ...defaultKeymap,
                    ...historyKeymap,
                    ...completionKeymap,
                ]),

                // 3. Language Support (Markdown)
                markdown({ codeLanguages: languages }),

                // 4. Custom WikiLink Feature
                wikiLinkPlugin, // The decorator for styling [[ ]]
                autocompletion({
                    override: [wikiLinkAutocomplete] // The dropdown logic
                }),

                // 5. Change Listener
                EditorView.updateListener.of((update) => {
                    if (update.docChanged && onChange) {
                        onChange(update.state.doc.toString());
                    }
                }),

                // 6. Theme (Basic minimal theme to look nice)
                EditorView.theme({
                    "&": { height: "100%", fontSize: "16px" },
                    ".cm-scroller": { fontFamily: 'Inter, sans-serif' }
                })
            ],
        });

        // Create the view
        const view = new EditorView({
            state: startState,
            parent: editorRef.current,
        });

        viewRef.current = view;

        // Cleanup on unmount
        return () => {
            view.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    return (
        <div
            ref={editorRef}
            className="w-full h-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all"
            style={{ minHeight: "600px" }}
        />
    );
};
