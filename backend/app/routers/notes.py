import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, update
from slugify import slugify

from ..database import get_db
from ..models import Note, Link, Tag, NoteTag
from ..schemas import NoteCreate, NoteRead, NoteUpdate, BacklinkResponse, TagRead

router = APIRouter()

def extract_snippet(full_text: str, target_title: str, context_chars: int = 60) -> str:
    if not full_text: return ""
    escaped_title = re.escape(target_title)
    pattern = re.compile(f"\\[\\[{escaped_title}(?:\\|[^\\]]+)?\\]\\]", re.IGNORECASE)
    match = pattern.search(full_text)
    if not match: return ""
    
    start_idx = match.start()
    end_idx = match.end()
    context_start = max(0, start_idx - context_chars)
    context_end = min(len(full_text), end_idx + context_chars)
    return f"{'...' if context_start > 0 else ''}{full_text[context_start:context_end]}{'...' if context_end < len(full_text) else ''}"

# --- CRUD Operations ---

@router.get("/notes", response_model=List[NoteRead])
async def get_notes(search: Optional[str] = None, is_favorite: Optional[bool] = None, limit: int = 100, db: Session = Depends(get_db)):
    stmt = select(Note).options(selectinload(Note.tags)).order_by(Note.updated_at.desc()).limit(limit)
    if search:
        if search.startswith('#'):
             # Search by Tag
             tag_name = search[1:]
             stmt = stmt.join(Note.tags).where(Tag.name == tag_name)
        else:
             # Search by Title
             stmt = stmt.where(Note.title.ilike(f"%{search}%"))
    if is_favorite is not None:
        stmt = stmt.where(Note.is_favorite == is_favorite)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/notes/search", response_model=List[NoteRead])
async def search_notes(q: str, db: Session = Depends(get_db)):
    """
    Dedicated endpoint for the Editor Autocomplete (WikiLinkExtension).
    Maps 'q' param to 'search' logic.
    """
    return await get_notes(search=q, db=db)

@router.post("/notes", response_model=NoteRead)
async def create_note(note: NoteCreate, db: Session = Depends(get_db)):
    # 1. Generate Slug
    slug = slugify(note.title)
    
    # 2. Check overlap
    stmt = select(Note).where(Note.slug == slug)
    existing = await db.execute(stmt)
    if existing.scalar_one_or_none():
         raise HTTPException(status_code=400, detail="Note with this title already exists")
    
    # 3. Create
    new_note = Note(
        title=note.title,
        slug=slug,
        content=note.content,
        visibility=note.visibility,
        owner_id=1, # Default User for MVP
        is_favorite=False
    )
    db.add(new_note)
    await db.commit()
    await db.refresh(new_note)
    
    # 4. Parse Links and Tags
    await update_graph_links(new_note, db)
    await update_tags(new_note, db)
    
    # Reload to get tags
    stmt = select(Note).options(selectinload(Note.tags)).where(Note.id == new_note.id)
    return (await db.execute(stmt)).scalar_one()

@router.get("/notes/{note_id}", response_model=NoteRead)
async def get_note(note_id: int, db: Session = Depends(get_db)):
    stmt = select(Note).options(selectinload(Note.tags)).where(Note.id == note_id)
    result = await db.execute(stmt)
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.put("/notes/{note_id}", response_model=NoteRead)
async def update_note(note_id: int, update_data: NoteUpdate, db: Session = Depends(get_db)):
    stmt = select(Note).where(Note.id == note_id)
    result = await db.execute(stmt)
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    if update_data.content is not None and update_data.content != note.content:
        print(f"DEBUG: Updating note {note.id}. Old Content: {note.content[:20]}... New Content: {update_data.content[:20]}...")
        # Save Revision of PREVIOUS content
        from ..models import Revision
        revision = Revision(
            note_id=note.id,
            author_id=1, # Default User
            content_snapshot=note.content
        )
        db.add(revision)
        
        # Prune old revisions (Limit to last 20)
        subquery = select(Revision.id).where(Revision.note_id == note.id).order_by(Revision.created_at.desc()).offset(4) # Keep 4 + current new one ~ 5
        old_revisions_result = await db.execute(subquery)
        old_revision_ids = old_revisions_result.scalars().all()
        
        if old_revision_ids:
            from sqlalchemy import delete
            await db.execute(delete(Revision).where(Revision.id.in_(old_revision_ids)))
        
        note.content = update_data.content
        db.add(note) # Explicitly add to session to ensure dirty tracking
        
        await update_graph_links(note, db)
        await update_tags(note, db)
        
    if update_data.visibility is not None:
        note.visibility = update_data.visibility

    if update_data.is_favorite is not None:
        note.is_favorite = update_data.is_favorite
        
    await db.commit()
    await db.refresh(note)
    print(f"DEBUG: Saved note {note.id}. Content after refresh: {note.content[:20]}...")
    
    # Reload with tags
    stmt = select(Note).options(selectinload(Note.tags)).where(Note.id == note_id)
    return (await db.execute(stmt)).scalar_one()

# --- Revisions ---

from ..schemas import RevisionRead

@router.get("/notes/{note_id}/revisions", response_model=List[RevisionRead])
async def get_note_revisions(note_id: int, db: Session = Depends(get_db)):
    from ..models import Revision
    # Verify note exists
    stmt = select(Note).where(Note.id == note_id)
    if not (await db.execute(stmt)).scalar_one_or_none():
         raise HTTPException(404, "Note not found")
         
    stmt = select(Revision).where(Revision.note_id == note_id).order_by(Revision.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.delete("/revisions/{revision_id}")
async def delete_revision(revision_id: int, db: Session = Depends(get_db)):
    from ..models import Revision
    from sqlalchemy import delete
    
    # 1. Check existence
    stmt = select(Revision).where(Revision.id == revision_id)
    revision = (await db.execute(stmt)).scalar_one_or_none()
    if not revision:
        raise HTTPException(404, "Revision not found")
        
    # 2. Delete
    await db.delete(revision)
    await db.commit()
    return {"message": "Revision deleted successfully"}

@router.delete("/notes/{note_id}")
async def delete_note(note_id: int, db: Session = Depends(get_db)):
    # 1. Check existence
    stmt = select(Note).where(Note.id == note_id)
    result = await db.execute(stmt)
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    # 2. Delete
    await db.delete(note)
    await db.commit()
    return {"message": "Note deleted successfully"}

@router.get("/notes/{note_id}/backlinks", response_model=List[BacklinkResponse])
async def get_note_backlinks(note_id: int, db: Session = Depends(get_db)):
    # 1. Get Target
    stmt = select(Note).where(Note.id == note_id)
    target = (await db.execute(stmt)).scalar_one_or_none()
    if not target: raise HTTPException(404, "Target note not found")
    
    # 2. Find sources via graph edges
    # We want notes that HAVE an edge pointing TO this note_id
    stmt = select(Note).join(Link, Link.source_note_id == Note.id)\
                       .where(Link.target_note_id == note_id)
    sources = (await db.execute(stmt)).scalars().all()
    
    results = []
    for src in sources:
        results.append(BacklinkResponse(
            source_id=src.id,
            source_title=src.title,
            snippet=extract_snippet(src.content, target.title)
        ))
    return results

@router.get("/tags", response_model=List[TagRead])
async def get_tags(db: Session = Depends(get_db)):
    stmt = select(Tag).order_by(Tag.name)
    result = await db.execute(stmt)
    return result.scalars().all()

# --- Helper: Graph Updater ---
async def update_graph_links(note: Note, db: Session):
    """
    Parses [[WikiLinks]] in the content and updates the 'links' table.
    """
    if not note.content: return
    
    # 1. Find all [[Title]] occurrences
    # Matches [[Title]] or [[Title|Alias]]
    targets = re.findall(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]', note.content)
    unique_targets = list(set(targets))
    
    # 2. Clear existing outgoing links
    from sqlalchemy import delete
    await db.execute(delete(Link).where(Link.source_note_id == note.id))
    
    # 3. Resolve Targets
    for target_title in unique_targets:
        # Find ID of target
        slug_candidate = slugify(target_title)
        stmt = select(Note.id).where(Note.slug == slug_candidate)
        target_id = (await db.execute(stmt)).scalar_one_or_none()
        
        if target_id:
            # Create Edge
            link = Link(source_note_id=note.id, target_note_id=target_id)
            db.add(link)

async def update_tags(note: Note, db: Session):
    """
    Parses #hashtags and updates note_tags table.
    """
    if not note.content: return

    # 1. Regex for #tag
    # Matches #word (alphanumeric + underscore)
    raw_tags = re.findall(r'#(\w+)', note.content)
    unique_tags = list(set(raw_tags))
    
    # 2. Get existing NoteTags
    tag_objs = []
    for t_name in unique_tags:
        # Find or create Tag
        stmt = select(Tag).where(Tag.name == t_name)
        tag = (await db.execute(stmt)).scalar_one_or_none()
        if not tag:
            tag = Tag(name=t_name)
            db.add(tag)
            await db.flush() # get ID
        tag_objs.append(tag)
        
    # Update relationship
    from sqlalchemy import delete
    await db.execute(delete(NoteTag).where(NoteTag.note_id == note.id))
    
    for t in tag_objs:
        nt = NoteTag(note_id=note.id, tag_id=t.id)
        db.add(nt)

