# MVP Implementation Plan

## Phase 1: Foundation & Infrastructure (Backend + DB)
**Goal:** A running API connected to PostgreSQL.
1.  **Setup Backend**: Initialize FastAPI project.
2.  **Database**: Spin up PostgreSQL using Docker.
3.  **ORM**: Implement SQLAlchemy models (`User`, `Note`, `Link`).
4.  **Auth**: Basic JWT Authentication (Login/Register).
5.  **API Basic CRUD**: `GET/POST /notes`.

## Phase 2: Frontend Skeleton & Editor
**Goal:** A user can log in and write Markdown.
1.  **Setup Frontend**: Next.js + Tailwind + ShadcnUI.
2.  **Layout**: Sidebar (File explorer mockup) + Main Content Area.
3.  **Editor Integration**: Install CodeMirror 6.
    -   Create a wrap component `<MarkdownEditor />`.
    -   Ensure it saves content to the Backend API.
4.  **Viewing Mode**: Use `react-markdown` to render the saved content.

## Phase 3: The WikiLink Core
**Goal:** The "Hyperlinked Knowledge" effect.
1.  **Editor Plugin**: Implement the CodeMirror ViewPlugin to highlight `[[...]]`.
2.  **Backend Logic**: Implement the "Save Listener".
    -   Regex parse content.
    -   Update `links` table.
3.  **Renderer**: Custom component for `react-markdown` that transforms `[[Link]]` into clickable anchors.
    -   Handle 404s (Red link? Prompt to create?).

## Phase 4: Graph Visualization
**Goal:** Visualizing the connections.
1.  **API Endpoint**: `GET /graph` -> Returns `{ nodes: [], links: [] }`.
2.  **Frontend**: Integrate `react-force-graph-2d` (or 3d).
3.  **Interactivity**: Click node -> Goto Note.
4.  **Backlinks Panel**: Add a sidebar section "Linked from..." asking the API for incoming links.

## Phase 5: Corporate Features (RBAC & Polish)
**Goal:** Ready for team usage.
1.  **Permissions**: Enforce `public` vs `private` visibility in the API.
2.  **Search**: Implement basic SQL `LIKE` search or `pg_trgm` fuzzy search.
3.  **Version History**: Enable the `Revision` table Logic (save snapshot on every update).
4.  **UI Polish**: Glassmorphism, animations, dark mode.
