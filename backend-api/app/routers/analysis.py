"""
Analysis Router

This module provides the core analysis endpoints for comparing
project costs across different time periods. It replaces the
run_forecast_pipeline_json function from the original Streamlit app.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
from app.database import get_db
from app.models.schemas import ForecastComparisonRequest, ProjectSummaryRequest
from app.services.sql_queries import query_batch_to_df


from app.services.data_processor import (
    combine_projects_rows,
    table_to_nested_json,
    compute_forecast_diff,
    hand_crafted_summary,
    preprocess_df_collapse_projects
)


from app.config import projects_list, metric_map
import tempfile
import json
from pathlib import Path
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/forecast-comparison")
def compare_forecasts(
    request: ForecastComparisonRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Main analysis endpoint - compares project costs between two periods.
    
    This is the core endpoint that replaces run_forecast_pipeline_json
    from the original Streamlit dashboard. It:
    
    1. Fetches data for both periods from SQL Server
    2. Combines related projects based on project_groups config
    3. Transforms flat data into nested cost hierarchy
    4. Computes differences between periods at all levels
    
    Args:
        request: Contains from_period, to_period, project_no, and metric
        db: Database session (injected by FastAPI)
    
    Returns:
        Dict containing project analysis with cost trajectories
    
    Raises:
        HTTPException 404: If no data found for a period
        HTTPException 500: If analysis fails
    """
    logger.info("POST /api/analysis/forecast-comparison")
    logger.info(f"  Request parameters:")
    logger.info(f"    - From Period: {request.from_period}")
    logger.info(f"    - To Period: {request.to_period}")
    logger.info(f"    - Project No: {request.project_no}")
    logger.info(f"    - Metric: {request.metric}")
    
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            out_paths = []

            # Process each period (from and to)
            for period in [request.from_period, request.to_period]:
                logger.info(f"  Processing period: {period}")
                # Query database for this period's data
                df = query_batch_to_df(db, period)
                
                if df.empty:
                    logger.warning(f"    No data found for period {period}")
                    raise HTTPException(
                        status_code=404,
                        detail=f"No data found for period {period}"
                    )
                
                logger.info(f"    Retrieved {len(df)} records from database")

                # Combine related projects (e.g., 2171 & 2172 become one)
                logger.debug(f"    Combining related projects...")
                df = combine_projects_rows(
                    df,
                    project_groups=projects_list,
                    sum_cols=metric_map[request.metric]
                )
                logger.info(f"    After combining: {len(df)} records")

                # Convert flat DataFrame to nested JSON structure
                logger.debug(f"    Converting to nested JSON structure...")
                json_file = table_to_nested_json(df, request.project_no)

                # Save to temp file for compute_forecast_diff
                out_path = tmpdir / f"output_{period}_{request.project_no}.json"
                with out_path.open("w", encoding="utf-8") as f:
                    json.dump(json_file, f, ensure_ascii=False, indent=2)
                logger.debug(f"    Saved to: {out_path.name}")
                out_paths.append(out_path)

            # Compute differences between the two periods
            logger.info(f"  Computing forecast differences...")
            result = compute_forecast_diff(out_paths, request.metric)
            
            # Log summary of results
            if "projects" in result:
                num_projects = len(result["projects"])
                logger.info(f"  Analysis complete: {num_projects} project(s) analyzed")
                for proj_no, proj_data in result["projects"].items():
                    total_diff = proj_data.get(f"total_{request.metric}", {}).get("difference", 0)
                    logger.info(f"    Project {proj_no}: {total_diff:,.2f} change")
            
            return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"  Analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@router.get("/summary/{project_no}")
def get_project_summary(
    project_no: int,
    from_period: str,
    to_period: str,
    metric: str,
    db: Session = Depends(get_db)
):
    """
    Generate a text summary for a project's cost changes.
    
    This endpoint is useful for AI chat functionality - it provides
    a human-readable narrative of the cost changes that can be used
    as context for an LLM to answer questions about the project.
    
    Args:
        project_no: The project ID to analyze
        from_period: Start period in YYYYMM format
        to_period: End period in YYYYMM format  
        metric: Either 'forecast_costs_at_completion' or 'ytd_actual'
        db: Database session
    
    Returns:
        dict: {"summary": "Human-readable cost summary text"}
    """
    logger.info(f"GET /api/analysis/summary/{project_no}")
    logger.info(f"  Parameters: {from_period} -> {to_period}, metric={metric}")
    
    try:
        # First run the full analysis
        result = compare_forecasts(
            ForecastComparisonRequest(
                from_period=from_period,
                to_period=to_period,
                project_no=project_no,
                metric=metric
            ),
            db=db
        )

        # Generate human-readable summary from the analysis results
        logger.debug("  Generating human-readable summary...")
        summary = hand_crafted_summary(result["projects"], metric)
        logger.info(f"  Summary generated ({len(summary)} characters)")

        return {"summary": summary}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"  Summary generation failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/overall-summary")
def get_overall_summary(
    request: ProjectSummaryRequest,
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get a collapsed project summary for a specific period.
    
    Arguments:
        request: Contains period and metric
        db: Database session
        
    Returns:
        List of dictionaries with collapsed project data
    """
    logger.info("POST /api/analysis/overall-summary")
    logger.info(f"  Period: {request.period}, Metric: {request.metric}")
    
    try:
        # Fetch data
        df = query_batch_to_df(db, request.period)
        
        if df.empty:
            logger.warning(f"  No data found for period {request.period}")
            raise HTTPException(
                status_code=404,
                detail=f"No data found for period {request.period}"
            )
        
        logger.info(f"  Retrieved {len(df)} records from database")
            
        # Collapse projects
        logger.debug("  Collapsing projects...")
        summary_df = preprocess_df_collapse_projects(df, request.metric)
        logger.info(f"  Collapsed to {len(summary_df)} projects")
        
        # Convert to list of dicts
        result = summary_df.to_dict(orient="records")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"  Summary generation failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")