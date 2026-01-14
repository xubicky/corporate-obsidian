import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// Backgrounds & Base Colors (Based on the screenshot's dark theme)
const obsidianDarkBg = "#1e1e1e"; // Dark Slate/Gray
const obsidianText = "#dcddde";   // Off-white
const obsidianSelection = "#264f78";
const obsidianCursor = "#aeafad";

export const obsidianTheme = EditorView.theme({
    "&": {
        color: obsidianText,
        backgroundColor: obsidianDarkBg,
        height: "100%",
        fontSize: "16px"
    },
    ".cm-content": {
        caretColor: obsidianCursor,
        padding: "24px",
    },
    ".cm-scroller": {
        fontFamily: "'Inter', sans-serif"
    },
    ".cm-line": {
        lineHeight: "1.6"
    },
    "&.cm-focused .cm-cursor": {
        borderLeftColor: obsidianCursor
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
        backgroundColor: obsidianSelection
    },
    ".cm-gutters": {
        backgroundColor: obsidianDarkBg,
        color: "#4b5263", // Line numbers
        border: "none"
    }
}, { dark: true });

export const obsidianHighlightStyle = HighlightStyle.define([
    // Headings
    { tag: t.heading1, color: "#61afef", fontWeight: "bold", fontSize: "1.6em" }, // Cyan-ish Blue
    { tag: t.heading2, color: "#e5c07b", fontWeight: "bold", fontSize: "1.4em" }, // Yellow/Gold
    { tag: t.heading3, color: "#98c379", fontWeight: "bold", fontSize: "1.25em" }, // Green
    { tag: t.heading4, color: "#56b6c2", fontWeight: "bold" },
    { tag: t.heading5, color: "#c678dd", fontWeight: "bold" },
    { tag: t.heading6, color: "#56b6c2", fontStyle: "italic" },

    // Metadata (Frontmatter)
    { tag: t.meta, color: "#7f848e", fontFamily: "monospace" },

    // Lists
    { tag: t.list, color: "#e06c75" }, // Red/Pink bullet points

    // Quotes
    { tag: t.quote, color: "#5c6370", fontStyle: "italic" },

    // Links & Urls
    { tag: t.link, color: "#c678dd", textDecoration: "none" }, // Purple/Pink
    { tag: t.url, color: "#56b6c2", textDecoration: "underline" },

    // Code
    { tag: t.monospace, color: "#98c379", backgroundColor: "#2c313a", borderRadius: "3px", padding: "1px 4px" },
    { tag: t.attributeName, color: "#e5c07b" },
    { tag: t.string, color: "#98c379" },
    { tag: t.keyword, color: "#c678dd" },
    { tag: t.bool, color: "#d19a66" },

    // Strong/Emphasis
    { tag: t.strong, color: "#e06c75", fontWeight: "bold" }, // Red/Pink bold
    { tag: t.emphasis, fontStyle: "italic", color: "#e5c07b" },
]);

export const obsidianSyntax = syntaxHighlighting(obsidianHighlightStyle);
