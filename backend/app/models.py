from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, Boolean
from sqlalchemy.orm import relationship
from .database import Base

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
    title = Column(String, index=True)
    slug = Column(String, unique=True, index=True)
    content = Column(Text, default="")
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    visibility = Column(String, default="team") # Storing enum as string
    is_favorite = Column(Boolean, default=False)
    
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="notes")
    revisions = relationship("Revision", back_populates="note")
    tags = relationship("Tag", secondary="note_tags", back_populates="notes")
    
    # Graph Edges
    outgoing_links = relationship(
        "Link",
        foreign_keys="[Link.source_note_id]",
        back_populates="source_note",
        cascade="all, delete-orphan"
    )
    incoming_links = relationship(
        "Link",
        foreign_keys="[Link.target_note_id]",
        back_populates="target_note",
        cascade="all, delete-orphan"
    )

class Link(Base):
    __tablename__ = "links"
    
    id = Column(Integer, primary_key=True, index=True)
    source_note_id = Column(Integer, ForeignKey("notes.id"), index=True)
    target_note_id = Column(Integer, ForeignKey("notes.id"), index=True)
    
    source_note = relationship("Note", foreign_keys=[source_note_id], back_populates="outgoing_links")
    target_note = relationship("Note", foreign_keys=[target_note_id], back_populates="incoming_links")

class Revision(Base):
    __tablename__ = "revisions"
    
    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    
    content_snapshot = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    note = relationship("Note", back_populates="revisions")
    author = relationship("User", back_populates="revisions")

class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    # Many-to-Many
    notes = relationship("Note", secondary="note_tags", back_populates="tags")

class NoteTag(Base):
    __tablename__ = "note_tags"
    
    note_id = Column(Integer, ForeignKey("notes.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)

class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, index=True)  # UUID-based stored filename
    original_name = Column(String)  # Original uploaded filename
    content_type = Column(String)  # MIME type
    size_bytes = Column(Integer)
    note_id = Column(Integer, ForeignKey("notes.id"), nullable=True)  # Optional link to note
    
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    note = relationship("Note", backref="attachments")
