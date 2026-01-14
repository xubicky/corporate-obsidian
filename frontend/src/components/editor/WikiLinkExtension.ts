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

const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

const wikiLinkDecoration = Decoration.mark({
  class: "cm-wikilink",
  attributes: { title: "Cmd+Click to open note" },
  tagName: "span",
});

const wikiLinkMatcher = new MatchDecorator({
  regexp: wikiLinkRegex,
  decoration: (match) => wikiLinkDecoration,
});

// We export a FACTORY function now to accept the callback
export const createWikiLinkPlugin = (onNavigate: (title: string) => void) => ViewPlugin.fromClass(
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
      mousedown: (e, view) => {
        const target = e.target as HTMLElement;
        // Check for correct class AND Cmd/Ctrl key
        if (target.classList.contains("cm-wikilink") && (e.metaKey || e.ctrlKey)) {
          e.preventDefault(); // Prevent default text selection

          // Content is usually "[[Title]]" or "[[Title|Alias]]"
          // innerText gives us the rendered text. 
          // However, the MatchDecorator styles the *matched range*.
          // So the text content of the span is the full "[[...]]".
          const fullText = target.innerText;

          // Regex to extract Title
          const match = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/.exec(fullText);
          if (match && match[1]) {
            const title = match[1];
            console.log("Navigating to:", title);
            onNavigate(title);
          }
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
  const word = context.matchBefore(/\[\[([^\]|]*)$/);
  if (!word) return null;
  if (word.from == word.to && !context.explicit) return null;

  const searchText = word.text.slice(2);

  try {
    const params = new URLSearchParams({ q: searchText });
    const response = await fetch(`http://localhost:8000/api/notes/search?${params}`);

    if (!response.ok) throw new Error("Failed to fetch notes");

    const notes: NoteSearchResult[] = await response.json();

    return {
      from: word.from + 2,
      options: notes.map((note) => ({
        label: note.title,
        detail: "Note",
        type: "variable",
        apply: note.title,
      })),
      filter: false,
    };
  } catch (error) {
    console.error("Autocomplete error:", error);
    return null;
  }
};
