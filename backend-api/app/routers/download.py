"""
Download Router

Provides endpoints to generate and download report files.
Currently supports:
  - POST /api/download/xlsx  — Excel cost breakdown workbook
"""

import logging
import json
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schemas import ForecastComparisonRequest
from app.services.sql_queries import query_batch_to_df
from app.services.data_processor import (
    combine_projects_rows,
    table_to_nested_json,
    compute_forecast_diff,
)
from app.config import projects_list, metric_map
from app.utils.report_builder import build_excel_cost_breakdown, projects_to_dataframe

logger = logging.getLogger(__name__)

router = APIRouter()

XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@router.post("/xlsx")
def download_xlsx(
    request: ForecastComparisonRequest,
    db: Session = Depends(get_db),
) -> Response:
    """
    Generate and return an Excel (.xlsx) cost breakdown report.

    Internally re-runs the same analysis pipeline as /api/analysis/forecast-comparison,
    then passes the result through the report builder to produce a multi-sheet workbook:
      - Projects sheet  — all-projects summary
      - {job_no}_main_types, {job_no}_costlines, {job_no}_children

    Returns:
        Binary .xlsx response with Content-Disposition: attachment header.
    """
    logger.info("POST /api/download/xlsx")
    logger.info(
        f"  Request: from={request.from_period} to={request.to_period} "
        f"project={request.project_no} metric={request.metric}"
    )

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            out_paths = []

            for period in [request.from_period, request.to_period]:
                logger.info(f"  Processing period: {period}")
                df = query_batch_to_df(db, period)

                if df.empty:
                    logger.warning(f"  No data found for period {period}")
                    raise HTTPException(
                        status_code=404,
                        detail=f"No data found for period {period}",
                    )

                logger.info(f"  Retrieved {len(df)} records")
                df = combine_projects_rows(
                    df,
                    project_groups=projects_list,
                    sum_cols=metric_map[request.metric],
                )
                json_data = table_to_nested_json(df, request.project_no)
                out_path = tmpdir / f"output_{period}_{request.project_no}.json"
                with out_path.open("w", encoding="utf-8") as f:
                    json.dump(json_data, f, ensure_ascii=False, indent=2)
                out_paths.append(out_path)

            logger.info("  Computing forecast differences...")
            result = compute_forecast_diff(out_paths, request.metric)
            projects = result.get("projects", {})

            logger.info(f"  Building Excel workbook for {len(projects)} project(s)...")
            df_summary = projects_to_dataframe(projects, request.metric)
            xlsx_bytes = build_excel_cost_breakdown(df_summary, projects)

            logger.info(f"  Workbook built ({len(xlsx_bytes):,} bytes). Returning response.")
            return Response(
                content=xlsx_bytes,
                media_type=XLSX_MIME,
                headers={
                    "Content-Disposition": 'attachment; filename="cost_breakdown.xlsx"',
                },
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"  Report generation failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Report generation failed: {str(e)}",
        )
