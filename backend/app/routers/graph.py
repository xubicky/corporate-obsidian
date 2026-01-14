from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.future import select

from ..database import get_db
from ..models import Note, Link

router = APIRouter()

@router.get("/graph")
async def get_graph(db: Session = Depends(get_db)):
    """
    Retrieves the entire knowledge graph.
    Optimized to return lightweight JSON.
    """
    
    # 1. Fetch all Nodes
    stmt_nodes = select(Note.id, Note.title, Note.visibility)
    result_nodes = await db.execute(stmt_nodes)
    
    nodes_data = []
    for row in result_nodes:
        nodes_data.append({
            "id": row.id,
            "title": row.title,
            "group": row.visibility or "public" # Color by visibility
        })

    # 2. Fetch all Edges
    stmt_links = select(Link.source_note_id, Link.target_note_id)
    result_links = await db.execute(stmt_links)
    
    links_data = []
    for row in result_links:
        links_data.append({
            "source": row.source_note_id,
            "target": row.target_note_id
        })

    return {
        "nodes": nodes_data,
        "links": links_data
    }
