import asyncio
from sqlalchemy import select
from app.database import engine, Base
from app.models import Note, Link
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from slugify import slugify

# Create a scoped session
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

SAMPLE_NOTES = [
    {
        "title": "Project Beta Launch",
        "content": """# Project Beta Launch
We are aiming for a **Q3 release**.

## Dependencies
- [[Marketing Strategy]]
- [[Technical Specification]]

## Risks
- Timeline is tight for the [[Q3 Roadmap]].
"""
    },
    {
        "title": "Marketing Strategy",
        "content": """# Marketing Strategy
Focus on content marketing and developer advocacy.

Aligned with [[Project Beta Launch]].
"""
    },
    {
        "title": "Technical Specification",
        "content": """# Technical Specification
Architecture diagrams and schema definitions for [[Project Beta Launch]].

Refers to standards in [[Engineering Handbook]].
"""
    },
    {
        "title": "Q3 Roadmap",
        "content": """# Q3 Roadmap
1. July: [[Project Beta Launch]]
2. August: User Feedback Loop
3. September: Scale Test
"""
    },
    {
        "title": "Engineering Handbook",
        "content": """# Engineering Handbook
Best practices for coding and deployment.

See [[Technical Specification]] for templates.
"""
    },
    {
        "title": "Daily Standup",
        "content": """# Daily Standup
**2026-01-13**:
- Terry updated [[Project Beta Launch]] status.
- Blocked on [[Marketing Strategy]] approval.
"""
    }
]

async def seed():
    async with AsyncSessionLocal() as db:
        print("Checking if DB is empty...")
        result = await db.execute(select(Note))
        if result.scalars().first():
            print("Database already has notes. Skipping seed.")
            return

        print("Seeding sample data...")
        
        # 1. Create Notes
        created_notes = {}
        for data in SAMPLE_NOTES:
            slug = slugify(data["title"])
            note = Note(
                title=data["title"],
                slug=slug,
                content=data["content"],
                visibility="team",
                owner_id=1
            )
            db.add(note)
            created_notes[data["title"]] = note
        
        await db.commit()
        
        # 2. Refresh to get IDs
        for note in created_notes.values():
            await db.refresh(note)
            
        # 3. Create Links (Naive Regex Parse)
        import re
        for note in created_notes.values():
            targets = re.findall(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]', note.content)
            unique_targets = list(set(targets))
            
            for target_title in unique_targets:
                target_note = created_notes.get(target_title)
                if target_note:
                    link = Link(source_note_id=note.id, target_note_id=target_note.id)
                    db.add(link)
        
        await db.commit()
        print("Seeding complete! Refresh your dashboard.")

if __name__ == "__main__":
    asyncio.run(seed())
