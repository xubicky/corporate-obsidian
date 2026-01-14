"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { useRouter } from "next/navigation";
import axios from "axios";

// Import our custom extensions
import { createWikiLinkPlugin, wikiLinkAutocomplete } from "./WikiLinkExtension";
import { createTagPlugin } from "./TagExtension"; // Import Tag Plugin
import "../../styles/editor.css";

// Import Custom Theme
import { cleanLightTheme, cleanLightSyntax } from "./themes/CleanLight";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Eye, Edit3, Image, Paperclip } from "lucide-react";
import { useNotes } from "@/context/NotesContext"; // Import Context


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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPreview, setIsPreview] = useState(false);
    const [content, setContent] = useState(initialValue);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();
    const { setSelectedTag } = useNotes(); // Get Context Setter

    // Navigation Handler
    const handleNavigate = async (title: string) => {
        try {
            // Find note by title
            const res = await axios.get("http://localhost:8000/api/notes/search", {
                params: { q: title }
            });
            const notes = res.data;

            // Simplified logic: Iterate and find exact match, else take first
            const match = notes.find((n: any) => n.title.toLowerCase() === title.toLowerCase()) || notes[0];

            if (match) {
                router.push(`/notes/${match.id}`);
            } else {
                router.push(`/notes/new?title=${encodeURIComponent(title)}`);
            }
        } catch (err) {
            console.error("Navigation failed", err);
        }
    };

    // Tag Click Handler
    const handleTagClick = (tag: string) => {
        console.log("Filtering by tag:", tag);
        setSelectedTag(tag); // Set filter
        // router.push("/notes"); // REMOVED: Stay on current page, let sidebar handle it
    };

    // Update internal content state when editor changes so we can render preview
    const handleEditorUpdate = (newContent: string) => {
        setContent(newContent);
        if (onChange) onChange(newContent);
    };

    // File Upload Handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await axios.post("http://localhost:8000/api/attachments", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const { url, original_name, content_type } = res.data;
            const fullUrl = `http://localhost:8000${url}`;

            // Insert appropriate markdown based on file type
            if (content_type.startsWith("image/")) {
                // Insert image markdown
                insertSyntax(`![${original_name}](${fullUrl})`, "");
            } else {
                // Insert link for PDFs and other files
                insertSyntax(`[📎 ${original_name}](${fullUrl})`, "");
            }
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Failed to upload file. Please try again.");
        } finally {
            setUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    useEffect(() => {
        if (!editorRef.current) return;

        // Instantiate the plugins
        const dynamicWikiLinkPlugin = createWikiLinkPlugin(handleNavigate);
        const dynamicTagPlugin = createTagPlugin(handleTagClick);

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

                // 4. Custom Plugins
                dynamicWikiLinkPlugin,
                dynamicTagPlugin, // Add Tag Plugin
                autocompletion({
                    override: [wikiLinkAutocomplete]
                }),

                // 5. Change Listener
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        handleEditorUpdate(update.state.doc.toString());
                    }
                }),

                // 6. Theme (Clean Light)
                cleanLightTheme,
                cleanLightSyntax
            ],
        });

        const view = new EditorView({
            state: startState,
            parent: editorRef.current,
        });

        viewRef.current = view;

        return () => {
            view.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle External Updates (e.g. Restore History)
    // If initialValue changes AND it is different from current editor content, update it.
    useEffect(() => {
        if (!viewRef.current || !initialValue) return;

        const currentDoc = viewRef.current.state.doc.toString();
        if (currentDoc !== initialValue) {
            viewRef.current.dispatch({
                changes: { from: 0, to: currentDoc.length, insert: initialValue }
            });
            // Reset local content state
            setContent(initialValue);
        }
    }, [initialValue]);

    // --- Toolbar Handlers ---
    const insertSyntax = (prefix: string, suffix: string = "") => {
        if (!viewRef.current) return;

        const view = viewRef.current;
        const { state, dispatch } = view;
        const selection = state.selection.main;
        const selectedText = state.sliceDoc(selection.from, selection.to);

        // Simple insertion/wrapping logic
        const textToInsert = prefix + selectedText + suffix;

        dispatch({
            changes: {
                from: selection.from,
                to: selection.to,
                insert: textToInsert
            },
            selection: {
                anchor: selection.from + prefix.length,
                head: selection.from + prefix.length + selectedText.length
            },
            userEvent: "input"
        });
        view.focus();
    };

    const toggleLinePrefix = (prefix: string) => {
        if (!viewRef.current) return;
        const view = viewRef.current;
        const { state, dispatch } = view;
        const line = state.doc.lineAt(state.selection.main.head);

        // Use logic to determine new cursor pos
        const isRemoving = line.text.startsWith(prefix);
        const shift = isRemoving ? -prefix.length : prefix.length;

        // Calculate new ranges for cursor (simple shift)
        // We clamp to line boundaries to be safe
        const newAnchor = Math.max(line.from, Math.min(line.to + shift, state.selection.main.anchor + shift));
        const newHead = Math.max(line.from, Math.min(line.to + shift, state.selection.main.head + shift));

        if (isRemoving) {
            dispatch({
                changes: { from: line.from, to: line.from + prefix.length, insert: "" },
                selection: { anchor: newAnchor, head: newHead }
            });
        } else {
            dispatch({
                changes: { from: line.from, insert: prefix },
                selection: { anchor: newAnchor, head: newHead }
            });
        }
        view.focus();
    };

    // Insert HTML Span for Style
    const insertStyle = (styleProp: string, value: string) => {
        if (!viewRef.current) return;
        const view = viewRef.current;
        const { state, dispatch } = view;
        const selection = state.selection.main;
        if (selection.empty) return; // Only wrap selection

        const selectedText = state.sliceDoc(selection.from, selection.to);
        const prefix = `<span style="${styleProp}: ${value}">`;
        const suffix = `</span>`;

        dispatch({
            changes: {
                from: selection.from,
                to: selection.to,
                insert: prefix + selectedText + suffix
            },
            selection: {
                anchor: selection.from + prefix.length + selectedText.length + suffix.length,
                head: selection.from + prefix.length + selectedText.length + suffix.length
            }
        });
        view.focus();
    }

    return (
        <div className="w-full h-full flex flex-col border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap select-none">
                <div className="flex items-center gap-0.5">
                    {/* Headings */}
                    <ToolbarButton label="H1" onClick={() => toggleLinePrefix("# ")} title="Heading 1" />
                    <ToolbarButton label="H2" onClick={() => toggleLinePrefix("## ")} title="Heading 2" />
                    <ToolbarButton label="H3" onClick={() => toggleLinePrefix("### ")} title="Heading 3" />

                    <div className="w-px h-4 bg-gray-300 mx-2" />

                    {/* Basic Formatting */}
                    <ToolbarButton label="B" bold onClick={() => insertSyntax("**", "**")} title="Bold (Cmd+B)" />
                    <ToolbarButton label="I" italic onClick={() => insertSyntax("*", "*")} title="Italic (Cmd+I)" />
                    <ToolbarButton label="S" onClick={() => insertSyntax("~~", "~~")} title="Strikethrough" />
                    <ToolbarButton label="Code" onClick={() => insertSyntax("`", "`")} title="Inline Code" />

                    <div className="w-px h-4 bg-gray-300 mx-2" />

                    {/* Structural */}
                    <ToolbarButton label="• List" onClick={() => toggleLinePrefix("- ")} title="Bullet List" />
                    <ToolbarButton label="1. List" onClick={() => toggleLinePrefix("1. ")} title="Numbered List" />
                    <ToolbarButton label="Quote" onClick={() => toggleLinePrefix("> ")} title="Quote" />

                    <div className="w-px h-4 bg-gray-300 mx-2" />

                    <ToolbarButton label="Link" onClick={() => insertSyntax("[[", "]]")} title="Internal Link" />

                    <div className="w-px h-4 bg-gray-300 mx-2" />

                    {/* Attachments */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${uploading
                                ? "text-slate-400 bg-slate-100 cursor-wait"
                                : "text-slate-600 hover:bg-slate-200"
                            }`}
                        title="Upload Image or PDF"
                        type="button"
                    >
                        <Image size={14} />
                        {uploading ? "..." : "Image"}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </div>

                {/* Preview is now always live/toggleable if needed, but we keep it simple per request. 
                    User asked for "limited options", removing preview toggle to keep UI clean? 
                    Actually, preview is essential for Markdown. Keeping it but aligned right.
                */}
                <div className="ml-auto">
                    <button
                        onClick={() => setIsPreview(!isPreview)}
                        className={`p-1.5 rounded hover:bg-slate-200 text-slate-500 ${isPreview ? 'bg-blue-100 text-blue-600' : ''}`}
                        title={isPreview ? "Edit Mode" : "Preview Mode"}
                    >
                        {isPreview ? <Edit3 size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div
                ref={editorRef}
                className="flex-1 overflow-auto text-base"
                style={{ minHeight: "500px" }}
            />
        </div>
    );
};

// Simple Button Component
const ToolbarButton = ({ label, onClick, title, bold, italic }: { label: string, onClick: () => void, title: string, bold?: boolean, italic?: boolean }) => (
    <button
        onClick={onClick}
        title={title}
        className={`px-3 py-1.5 rounded text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors ${bold ? "font-bold" : ""} ${italic ? "italic" : ""}`}
        type="button" // Prevent form submission if in form
    >
        {label}
    </button>
);
