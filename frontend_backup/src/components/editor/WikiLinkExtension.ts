import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  MatchDecorator,
  WidgetType,
} from "@codemirror/view";
import {
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";

// ------------------------------------
// 1. STYLING EXTENSION (Decorator)
// ------------------------------------

// Regex to find [[...]] content.
// We capture the inner content to potentially link it or just style the whole block.
// Simplest approach: Highlight the whole [[Link]] span.
const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

// Define the style decoration
const wikiLinkDecoration = Decoration.mark({
  class: "cm-wikilink", // We will define this class in CSS
  attributes: { title: "Cmd+Click to open note" },
  tagName: "span",
});

// Use MatchDecorator to automatically maintain decorations
const wikiLinkMatcher = new MatchDecorator({
  regexp: wikiLinkRegex,
  decoration: (match) => wikiLinkDecoration,
});

// The ViewPlugin that attaches the decorator to the editor view
export const wikiLinkPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = wikiLinkMatcher.createDeco(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = wikiLinkMatcher.createDeco(update.view);
      }
    }
  },
  {
    decorations: (instance) => instance.decorations,
    eventHandlers: {
        // Optional: Add click handler directly in the editor
        mousedown: (e, view) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains("cm-wikilink") && (e.metaKey || e.ctrlKey)) {
                // Extract text and cleaner logic here or let the parent handle via 'onClick' approach
                // For now, prevent default selection to allow 'navigation' feeling
                console.log("WikiLink clicked:", target.innerText);
            }
        }
    }
  }
);

// ------------------------------------
// 2. AUTOCOMPLETE EXTENSION
// ------------------------------------

interface NoteSearchResult {
  title: string;
  slug: string;
}

export const wikiLinkAutocomplete = async (context: CompletionContext): Promise<CompletionResult | null> => {
  // 1. check if the cursor is currently after a "[["
  // matchBefore looks backwards from cursor. 
  // We want to match "[[", optionally followed by some text that DOES NOT contain "]]" or "|"
  const word = context.matchBefore(/\[\[([^\]|]*)$/);

  if (!word) return null;
  
  // If explicitly closed or looks complete, stop.
  if (word.from == word.to && !context.explicit) return null;

  // 2. Extract the search term (the text after [[)
  const searchText = word.text.slice(2); // remove "[["

  try {
    // 3. Update this URL to your actual backend port/path
    // Use URLSearchParams for safe encoding
    const params = new URLSearchParams({ q: searchText });
    const response = await fetch(`http://localhost:8000/api/notes/search?${params}`);
    
    if (!response.ok) {
        throw new Error("Failed to fetch notes");
    }
    
    const notes: NoteSearchResult[] = await response.json();

    // 4. Transform to CodeMirror options
    return {
      from: word.from + 2, // Start replacing AFTER the [[
      options: notes.map((note) => ({
        label: note.title,
        detail: "Note",
        type: "variable", // Icon type
        apply: note.title, // What text to insert
        // You could also insert '[[note.title]]' but the user typically just typed [[ 
        // so we fill the rest. MATCHING logic determines start point.
        // adjustments might be needed depending on interaction preference.
      })),
      filter: false, // We let the API do the filtering usually, or set true if API returns all
    };
  } catch (error) {
    console.error("Autocomplete error:", error);
    return null;
  }
};
