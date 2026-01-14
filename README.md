# Corporate Obsidian

A database-backed, multi-user knowledge base with Markdown support, WikiLinks, and Graph visualization.

## Architecture

See the `design_docs/` directory for detailed specifications:
- **[Database Schema](design_docs/schema.md)**
- **[WikiLink Parser Logic](design_docs/wikilink_logic.md)**
- **[Project Structure](design_docs/project_structure.md)**
- **[Implementation Plan](design_docs/implementation_plan.md)**

## Quick Start

### Backend
1.  Navigate to `backend/`.
2.  Install dependencies: `pip install -r requirements.txt`.
3.  Run: `uvicorn app.main:app --reload`.

### Frontend
1.  Navigate to `frontend/`.
2.  Install dependencies (after initializing).
3.  Run: `npm run dev`.
