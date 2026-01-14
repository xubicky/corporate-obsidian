from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# FALLBACK: Using SQLite for local dev without Docker
# SQLALCHEMY_DATABASE_URL = "postgresql+asyncpg://obsidian:securepassword@localhost:5432/corporate_obsidian"
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./corporate_obsidian_v2.db"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=True, # Log SQL for debugging
    connect_args={"check_same_thread": False} # Needed for SQLite
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

# Dependency for FastAPI routes
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
