# Database Schema Design

We will use **PostgreSQL** with **SQLAlchemy** (async) for the ORM.

## Entity Relationship Diagram (Conceptual)

- **User**: System users.
- **Note**: The core knowledge unit. Contains current content.
- **Revision**: History of changes for a note.
- **Link**: Directed edges between notes for the graph.

## SQLAlchemy Models (Draft)

```python
from enum import Enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, TIMESTAMP
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Visibility(str, Enum):
    PUBLIC = "public"
    TEAM = "team"
    PRIVATE = "private"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    full_name = Column(String)
    role = Column(String, default="editor")  # admin, editor, viewer

    notes = relationship("Note", back_populates="owner")
    revisions = relationship("Revision", back_populates="author")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)  # Serves as the unique ID for WikiLinks usually, or we use a slug.
    slug = Column(String, unique=True, index=True) # Normalized title for URL usage
    content = Column(Text) # Current Markdown content
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    visibility = Column(String, default=Visibility.TEAM)
    
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="notes")
    revisions = relationship("Revision", back_populates="note")
    
    # For the Graph
    # outgoing links: defined by parsing content
    outgoing_links = relationship(
        "Link",
        foreign_keys="[Link.source_note_id]",
        back_populates="source_note",
        cascade="all, delete-orphan"
    )
    # incoming links
    incoming_links = relationship(
        "Link",
        foreign_keys="[Link.target_note_id]",
        back_populates="target_note"
    )

class Link(Base):
    __tablename__ = "links"
    
    id = Column(Integer, primary_key=True)
    source_note_id = Column(Integer, ForeignKey("notes.id"), index=True)
    target_note_id = Column(Integer, ForeignKey("notes.id"), index=True)
    
    # Store metadata about the link if needed (e.g., context)
    
    source_note = relationship("Note", foreign_keys=[source_note_id], back_populates="outgoing_links")
    target_note = relationship("Note", foreign_keys=[target_note_id], back_populates="incoming_links")

class Revision(Base):
    __tablename__ = "revisions"
    
    id = Column(Integer, primary_key=True)
    note_id = Column(Integer, ForeignKey("notes.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    
    content_snapshot = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    note = relationship("Note", back_populates="revisions")
    author = relationship("User", back_populates="revisions")
```

## RBAC & Security
- **Row Level Security** (Optional but good): Can be implemented in Postgres or Application layer.
- **Application Layer**:
  - `GET /notes/{slug}`: Check `note.visibility`. If `private`, `current_user.id` must match `note.owner_id`.
  - `POST /notes`: Authenticated users only.
  - `PUT /notes/{slug}`: Owner or Team Member (if RBAC allows).
