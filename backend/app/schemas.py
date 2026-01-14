from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

# Note Schemas
class TagRead(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class NoteBase(BaseModel):
    title: str
    content: Optional[str] = ""
    visibility: Optional[str] = "team"

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    content: Optional[str] = None
    visibility: Optional[str] = None
    is_favorite: Optional[bool] = None

class NoteRead(NoteBase):
    id: int
    slug: str
    updated_at: datetime
    owner_id: Optional[int]
    is_favorite: bool = False
    tags: List["TagRead"] = []

    class Config:
        from_attributes = True

# Backlink Schemas
class BacklinkResponse(BaseModel):
    source_id: int
    source_title: str
    snippet: str

class RevisionRead(BaseModel):
    id: int
    note_id: int
    content_snapshot: str
    created_at: datetime
    
    class Config:
        from_attributes = True
