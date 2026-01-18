"""
Projects Router

This module provides API endpoints for retrieving available
projects and periods from the database. These are used to
populate filter dropdowns in the frontend.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
from app.database import get_db
from app.utils.helpers import get_filter_options
from typing import List

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/periods")
def get_available_periods(db: Session = Depends(get_db)):
    """
    Get list of available periods from the database.
    
    Returns periods in YYYYMM format (e.g., '202301' for January 2023).
    These are used to populate the period filter dropdowns in the UI.
    
    Returns:
        dict: {"periods": ["202301", "202302", ...]}
    """
    logger.info("GET /api/projects/periods - Fetching available periods")
    try:
        periods, _ = get_filter_options(db)
        # Filter to only include valid YYYYMM format periods
        valid_periods = [p for p in periods if isinstance(p, str) and len(p) == 6 and p.isdigit()]
        logger.info(f"  Found {len(valid_periods)} valid periods")
        logger.debug(f"  Periods: {sorted(valid_periods)}")
        return {"periods": sorted(valid_periods)}
    except Exception as e:
        logger.error(f"  Failed to fetch periods: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
def get_available_projects(db: Session = Depends(get_db)):
    """
    Get list of available project numbers from the database.
    
    Returns all distinct project IDs that have data in the system.
    These are used to populate the project filter dropdown in the UI.
    
    Returns:
        dict: {"projects": [2035, 2121, 2171, ...]}
    """
    logger.info("GET /api/projects/list - Fetching available projects")
    try:
        _, projects = get_filter_options(db)
        logger.info(f"  Found {len(projects)} projects")
        logger.debug(f"  Projects: {sorted(projects)}")
        return {"projects": sorted(projects)}
    except Exception as e:
        logger.error(f"  Failed to fetch projects: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))