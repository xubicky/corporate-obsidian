import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..database import get_db
from ..models import Attachment

router = APIRouter()

# Configure upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed file types
ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/attachments")
async def upload_attachment(
    file: UploadFile = File(...),
    note_id: int = None,
    db: Session = Depends(get_db)
):
    """
    Upload a file (image or PDF) and return its URL.
    """
    # 1. Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"File type not allowed. Allowed: {list(ALLOWED_TYPES.keys())}")
    
    # 2. Read file content
    content = await file.read()
    
    # 3. Validate size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)}MB")
    
    # 4. Generate unique filename
    ext = ALLOWED_TYPES[file.content_type]
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # 5. Save file
    with open(file_path, "wb") as f:
        f.write(content)
    
    # 6. Create database record
    attachment = Attachment(
        filename=unique_filename,
        original_name=file.filename,
        content_type=file.content_type,
        size_bytes=len(content),
        note_id=note_id
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    
    # 7. Return info
    return {
        "id": attachment.id,
        "filename": unique_filename,
        "original_name": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(content),
        "url": f"/api/attachments/{unique_filename}"
    }


@router.get("/attachments/{filename}")
async def get_attachment(filename: str, db: Session = Depends(get_db)):
    """
    Serve an uploaded file.
    """
    # 1. Check existence in DB
    stmt = select(Attachment).where(Attachment.filename == filename)
    result = await db.execute(stmt)
    attachment = result.scalar_one_or_none()
    
    if not attachment:
        raise HTTPException(404, "Attachment not found")
    
    # 2. Build path
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found on disk")
    
    # 3. Serve file
    return FileResponse(
        file_path,
        media_type=attachment.content_type,
        filename=attachment.original_name
    )


@router.delete("/attachments/{attachment_id}")
async def delete_attachment(attachment_id: int, db: Session = Depends(get_db)):
    """
    Delete an attachment.
    """
    stmt = select(Attachment).where(Attachment.id == attachment_id)
    result = await db.execute(stmt)
    attachment = result.scalar_one_or_none()
    
    if not attachment:
        raise HTTPException(404, "Attachment not found")
    
    # Delete file from disk
    file_path = os.path.join(UPLOAD_DIR, attachment.filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Delete from DB
    await db.delete(attachment)
    await db.commit()
    
    return {"message": "Attachment deleted successfully"}
