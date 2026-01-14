import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// Corporate / Apple-ish Light Theme
const mainBg = "#ffffff";
const mainText = "#1e293b"; // Slate-800
const cursorColor = "#0f172a"; // Slate-900
const selectionBg = "#e2e8f0"; // Slate-200
const gutterBg = "#ffffff";
const gutterText = "#94a3b8"; // Slate-400

export const cleanLightTheme = EditorView.theme({
    "&": {
        color: mainText,
        backgroundColor: mainBg,
        height: "100%",
        fontSize: "16px"
    },
    ".cm-content": {
        caretColor: cursorColor,
        padding: "24px",
    },
    ".cm-scroller": {
        fontFamily: "'Inter', sans-serif"
    },
    ".cm-line": {
        lineHeight: "1.6"
    },
    "&.cm-focused .cm-cursor": {
        borderLeftColor: cursorColor
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
        backgroundColor: selectionBg
    },
    ".cm-gutters": {
        backgroundColor: gutterBg,
        color: gutterText,
        border: "none",
        borderRight: "1px solid #f1f5f9" // very subtle separator
    }
}, { dark: false });

export const cleanLightHighlightStyle = HighlightStyle.define([
    // Headings
    { tag: t.heading1, color: "#0f172a", fontWeight: "800", fontSize: "1.6em" }, // Slate-900
    { tag: t.heading2, color: "#334155", fontWeight: "700", fontSize: "1.4em" }, // Slate-700
    { tag: t.heading3, color: "#475569", fontWeight: "600", fontSize: "1.25em" }, // Slate-600
    { tag: t.heading4, color: "#475569", fontWeight: "600" },

    // Metadata
    { tag: t.meta, color: "#94a3b8" },

    // Lists
    { tag: t.list, color: "#3b82f6" }, // Blue bullet points

    // Quotes
    { tag: t.quote, color: "#64748b", fontStyle: "italic", borderLeft: "2px solid #cbd5e1" },

    // Links & Urls
    { tag: t.link, color: "#2563eb", textDecoration: "none" }, // Blue-600
    { tag: t.url, color: "#0ea5e9", textDecoration: "underline" },

    // Code
    { tag: t.monospace, color: "#db2777", backgroundColor: "#f3f4f6", borderRadius: "4px", padding: "1px 4px" }, // Pinkish
    { tag: t.keyword, color: "#7c3aed", fontWeight: "bold" }, // Violet

    // Strong/Emphasis
    { tag: t.strong, color: "#be123c", fontWeight: "bold" }, // Red/Rose bold
    { tag: t.emphasis, fontStyle: "italic", color: "#b45309" }, // Amber
]);

export const cleanLightSyntax = syntaxHighlighting(cleanLightHighlightStyle);
