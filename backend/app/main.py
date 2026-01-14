from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import graph, notes, attachments

app = FastAPI(title="Corporate Obsidian API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup (Dev only - use Alembic for Prod)
@app.on_event("startup")
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(graph.router, prefix="/api", tags=["graph"])
app.include_router(notes.router, prefix="/api", tags=["notes"])
app.include_router(attachments.router, prefix="/api", tags=["attachments"])

@app.get("/")
async def root():
    return {"message": "Corporate Obsidian API is running"}
