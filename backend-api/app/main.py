"""
Finance Dashboard API - Main Application Entry Point

This module initializes the FastAPI application and configures:
- CORS middleware for Next.js frontend communication
- API routers for projects and analysis endpoints
- Health check and root endpoints
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import os
import logging
from app.routers import projects, analysis, download

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI application with metadata for OpenAPI docs
app = FastAPI(
    title="Finance Dashboard API",
    version="1.0.0",
    description="API for financial forecast analysis - compares project costs across periods"
)

# Configure CORS to allow requests from the Next.js frontend
# In production, replace with your actual domain
allowed_origins = ["http://localhost:3000"]  # Next.js dev server
logger.info(f"Configuring CORS with allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to add test mode header when TEST_MODE is enabled
class TestModeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Check if TEST_MODE environment variable is set to true
        test_mode = os.getenv("TEST_MODE", "false").lower() == "true"
        if test_mode:
            response.headers["x-backend-test-mode"] = "true"
            logger.debug(f"Test mode header added to response for {request.url.path}")
        
        return response

# Add test mode middleware
test_mode = os.getenv("TEST_MODE", "false").lower() == "true"
logger.info(f"Test mode: {'ENABLED' if test_mode else 'DISABLED'}")
app.add_middleware(TestModeMiddleware)

# Register API routers with their URL prefixes
logger.info("Registering API routers...")
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
logger.info("  - /api/projects (Projects endpoints)")
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
logger.info("  - /api/analysis (Analysis endpoints)")
app.include_router(download.router, prefix="/api/download", tags=["Download"])
logger.info("  - /api/download (Download endpoints)")


# Log startup information
port = os.getenv("PORT", "8000")
logger.info("="*60)
logger.info("Finance Dashboard API Starting...")
logger.info(f"Server will run on port: {port}")
logger.info(f"Test mode: {'ENABLED (using XLSX files)' if test_mode else 'DISABLED (using database)'}")
logger.info(f"CORS origins: {allowed_origins}")
logger.info("API Documentation available at: /docs")
logger.info("="*60)


@app.get("/")
def root():
    """
    Root endpoint - returns API information.
    Useful for verifying the API is running.
    """
    logger.info("Root endpoint accessed")
    return {"message": "Finance Dashboard API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    Returns a simple status indicating the API is operational.
    """
    logger.debug("Health check endpoint accessed")
    return {"status": "healthy"}