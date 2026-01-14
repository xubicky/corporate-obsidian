# WikiLink Parser Logic & Strategy

The "WikiLink" feature is the core connector of the graph. It relies on a specific syntax `[[Page Name]]` or `[[Page Name|Alias]]`.

## 1. The Regex Strategy
A robust regex to capture these links is:
```regex
\[\[([^\]|]+)(?:\|([^\]]+))?\]\]
```
- **Group 1**: The Page Name (Target).
- **Group 2**: The Alias (Optional Label).

## 2. Frontend Logic (CodeMirror 6)
We need a **ViewPlugin** or **StateField** to decorate the editor.

### Implementation Concept:
1.  **Tokenizer**: As the user types, scan the visible range for the Regex.
2.  **Decoration**:
    -   Replace the `[[...]]` text with a styled "chip" or link widget (using `Decoration.replace` or `Decoration.mark`).
    -   **OR** (Simpler for Editor): Keep the text visible but style it (change color, underline).
    -   **Click Handler**: Add an event listener. When clicked:
        1.  Extract the "Page Name".
        2.  Call API: `GET /notes/{page_name_slug}`.
        3.  If 200 OK: Navigate to the note.
        4.  If 404 Not Found: Open a Modal "Create Note: {Page Name}?".

### CodeMirror Extension
We will use `@codemirror/view` and `@codemirror/state`.
```javascript
// Pseudo-code for CodeMirror Extension
import { Decoration, ViewPlugin, MatchDecorator } from "@codemirror/view"

const wikiLinkDecorator = new MatchDecorator({
  regexp: /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
  decoration: (match) => {
    const pageName = match[1];
    const alias = match[2] || pageName;
    return Decoration.mark({
      class: "cm-wikilink", // SCSS class for styling (blue, underlined)
      attributes: { "data-target": pageName }
    })
  }
})

export const wikiLinkPlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorator = wikiLinkDecorator.createDeco(view)
  }
  update(update) {
    if (update.docChanged || update.viewportChanged) {
      this.decorator = wikiLinkDecorator.createDeco(update.view)
    }
  }
}, {
  decorations: v => v.decorator
})
```

## 3. Backend Parsing & Graph Update (FastAPI)
When a note is **Saved** (`PUT /notes/{id}` or `POST`):

1.  **Receive Content**: The backend receives the full Markdown string.
2.  **Extract Links**: Use the Regex to find all *unique* targets.
    ```python
    import re
    # targets a list of strings
    targets = re.findall(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]', content)
    ```
3.  **Resolve IDs**:
    -   Query the `notes` table for these titles/slugs to get `target_note_id`s.
    -   If a target note doesn't exist yet, we can either:
        -   Start a "Ghost Node" (create a record with `is_ghost=True`).
        -   Or just ignore it in the graph until created. **Recommendation**: Ignore edges to non-existent notes for the MVP to keep SQL clean, OR create them as empty placeholders.
4.  **Update Edges**:
    -   **Transaction**:
        1.  `DELETE FROM links WHERE source_note_id = current_note.id`
        2.  `INSERT INTO links (source_note_id, target_note_id) VALUES ...` for each valid target.

## 4. Backlink Logic
Querying "What pages link to Page A?" becomes a simple SQL query thanks to the `links` table.

```sql
SELECT source_note_id, title 
FROM links 
JOIN notes ON links.source_note_id = notes.id 
WHERE target_note_id = :current_note_id
```

## 5. Rendering
On the frontend *read mode* (non-editor), we use a Markdown renderer (like `react-markdown`).
-   We write a custom plugin/component for `[[...]]`.
-   It renders a Next.js `<Link href="/note/slug">` component.
-   Class determines status: `.wikilink-exists` (blue) vs `.wikilink-missing` (red/gray).
