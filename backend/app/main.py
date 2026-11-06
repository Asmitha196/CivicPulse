import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.session import Base, engine, SessionLocal
from app.routes.auth import router as auth_router
from app.routes.categories import router as categories_router
from app.routes.reports import router as reports_router
from app.routes.issues import router as issues_router
from app.routes.ai import router as ai_router
from app.routes.assignments import router as assignments_router
from app.routes.evidence import router as evidence_router
from app.routes.feedback import router as feedback_router
from app.routes.notifications import router as notifications_router
from app.routes.analytics import router as analytics_router
from app.routes.seed import router as seed_router, seed_database_internal

logger = logging.getLogger("civicpulse")
logging.basicConfig(level=logging.INFO)

# Ensure upload directories exist
os.makedirs(os.path.join("uploads", "reports"), exist_ok=True)
os.makedirs(os.path.join("uploads", "evidence"), exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables created and default categories seeded
    logger.info("[CivicPulse] Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        seed_database_internal(db)
        logger.info("[CivicPulse] Default data verified.")
    except Exception as e:
        logger.warning(f"[CivicPulse] Seed notice: {e}")
    finally:
        db.close()

    yield
    # Shutdown
    logger.info("[CivicPulse] Server shutting down.")

app = FastAPI(
    title="CivicPulse – Community Problem Reporting & Resolution Platform",
    description="PS-14 Technovate 2.0 Full-Stack Civic Problem Reporting and Resolution System",
    version="2.0.0",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files statically
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include Routers
app.include_router(auth_router, prefix="/api")
app.include_router(categories_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(issues_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(assignments_router, prefix="/api")
app.include_router(evidence_router, prefix="/api")
app.include_router(feedback_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(seed_router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CivicPulse API",
        "version": "2.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

