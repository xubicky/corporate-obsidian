import {
    Decoration,
    DecorationSet,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    MatchDecorator,
} from "@codemirror/view";

// ------------------------------------
// TAG EXTENSION
// ------------------------------------

// Match #tag, #longer_tag (alphanumeric + underscore)
const tagRegex = /#(\w+)/g;

const tagDecoration = Decoration.mark({
    class: "cm-hashtag",
    attributes: { title: "Click to filter by this tag" },
    tagName: "span",
});

const tagMatcher = new MatchDecorator({
    regexp: tagRegex,
    decoration: (match) => tagDecoration,
});

export const createTagPlugin = (onTagClick: (tag: string) => void) => ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = tagMatcher.createDeco(view);
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = tagMatcher.createDeco(update.view);
            }
        }
    },
    {
        decorations: (instance) => instance.decorations,
        eventHandlers: {
            mousedown: (e, view) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains("cm-hashtag")) {
                    e.preventDefault();
                    const fullText = target.innerText; // e.g. "#project"
                    const tag = fullText.substring(1); // "project"
                    console.log("Tag clicked:", tag);
                    onTagClick(tag);
                }
            }
        }
    }
);
