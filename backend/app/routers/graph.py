from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.future import select

from ..database import get_db
from ..models import Note, Link, Tag, NoteTag

router = APIRouter()

@router.get("/graph")
async def get_graph(db: Session = Depends(get_db)):
    """
    Retrieves the entire knowledge graph.
    Optimized to return lightweight JSON.
    Includes tags as separate nodes with note-tag relationships.
    """
    
    # 1. Fetch all Note Nodes
    stmt_nodes = select(Note.id, Note.title, Note.visibility)
    result_nodes = await db.execute(stmt_nodes)
    
    nodes_data = []
    for row in result_nodes:
        nodes_data.append({
            "id": row.id,
            "title": row.title,
            "group": row.visibility or "public",  # Color by visibility
            "type": "note"
        })

    # 2. Fetch all Note-to-Note Links
    stmt_links = select(Link.source_note_id, Link.target_note_id)
    result_links = await db.execute(stmt_links)
    
    links_data = []
    for row in result_links:
        links_data.append({
            "source": row.source_note_id,
            "target": row.target_note_id,
            "type": "note-link"
        })

    # 3. Fetch all Tags as nodes
    stmt_tags = select(Tag.id, Tag.name)
    result_tags = await db.execute(stmt_tags)
    
    tags_data = []
    for row in result_tags:
        # Use string IDs for tags to avoid collision with note IDs
        tags_data.append({
            "id": f"tag-{row.id}",
            "title": f"#{row.name}",
            "group": "tag",
            "type": "tag"
        })

    # 4. Fetch all Note-Tag relationships
    stmt_note_tags = select(NoteTag.note_id, NoteTag.tag_id)
    result_note_tags = await db.execute(stmt_note_tags)
    
    tag_links_data = []
    for row in result_note_tags:
        tag_links_data.append({
            "source": row.note_id,
            "target": f"tag-{row.tag_id}",
            "type": "tag-link"
        })

    return {
        "nodes": nodes_data,
        "links": links_data,
        "tags": tags_data,
        "tagLinks": tag_links_data
    }
