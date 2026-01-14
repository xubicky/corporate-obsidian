# Project Structure

The project will be a **Monorepo** containing both the Frontend and Backend to keep context together.

```
/corporate-obsidian
├── README.md                   # Project overview
├── docker-compose.yml          # Orchestration for local dev (DB + Backend + Frontend)
├── .gitignore
├── /design_docs                # Architecture & Plans
│   ├── schema.md
│   ├── wikilink_logic.md
│   └── implementation_plan.md
│
├── /backend                    # Python FastAPI
│   ├── main.py                 # App entrypoint
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── /app
│   │   ├── __init__.py
│   │   ├── config.py           # Env vars & DB URL
│   │   ├── database.py         # SQLAlchemy engine & session
│   │   ├── models.py           # ORM Models (User, Note, Link)
│   │   ├── schemas.py          # Pydantic Models (Request/Response)
│   │   ├── crud.py             # DB operations
│   │   ├── /routers            # API Endpoints
│   │   │   ├── auth.py
│   │   │   ├── notes.py
│   │   │   └── graph.py
│   │   └── /utils
│   │       └── parser.py       # WikiLink regex logic
│   └── /alembic                # DB Migrations (if using Alembic)
│
└── /frontend                   # Next.js App Router
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── Dockerfile
    ├── /public
    ├── /src
    │   ├── /app                # Next.js Pages (App Router)
    │   │   ├── layout.tsx      # Main layout (Sidebar + Content)
    │   │   ├── page.tsx        # Dashboard / Graph View
    │   │   ├── /login
    │   │   │   └── page.tsx
    │   │   └── /note
    │   │       └── [slug]
    │   │           └── page.tsx # Note View/Edit Mode
    │   ├── /components
    │   │   ├── /ui             # ShadcnUI components
    │   │   ├── /editor         # CodeMirror specifics
    │   │   │   ├── Editor.tsx
    │   │   │   └── WikiLinkPlugin.ts
    │   │   ├── /graph          # React-Force-Graph wrapper
    │   │   │   └── NetworkGraph.tsx
    │   │   └── Sidebar.tsx
    │   ├── /lib
    │   │   ├── api.ts          # Axios/Fetch wrapper
    │   │   └── utils.ts
    │   └── /styles
    │       └── globals.css
```
