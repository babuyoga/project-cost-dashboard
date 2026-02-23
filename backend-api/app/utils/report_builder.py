"""
Report Builder Utility

Generates in-memory Excel (.xlsx) workbooks from project cost analysis data.
Uses openpyxl as the engine via pd.ExcelWriter — no temp files written to disk.
"""

import io
import pandas as pd
from typing import Any, Dict

import logging

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# DataFrame extraction helpers
# ---------------------------------------------------------------------------

def projects_to_dataframe(projects: Dict[str, Any], metric: str) -> pd.DataFrame:
    """
    Convert the top-level projects dict (from compute_forecast_diff) into a
    flat summary DataFrame. Monetary values are divided by 1000 (→ millions).
    """
    rows = []
    for job_no, proj in projects.items():
        total = proj.get(f"total_{metric}", {})
        file1 = total.get("file1", 0.0)
        file2 = total.get("file2", 0.0)
        diff = file2 - file1
        rows.append({
            "job_no": job_no,
            "description": proj.get("project_meta", {}).get("description", ""),
            "client": proj.get("project_meta", {}).get("client", ""),
            "period1": total.get("period1", ""),
            "period2": total.get("period2", ""),
            "file1_metric": round(file1 / 1000, 3),
            "file2_metric": round(file2 / 1000, 3),
            "difference": round(diff / 1000, 3),
            "difference_abs": round(abs(diff) / 1000, 3),
        })
    df = pd.DataFrame(rows)
    if not df.empty:
        df = df.sort_values("difference_abs", ascending=False).reset_index(drop=True)
    return df


def main_costtypes_df(proj: Dict[str, Any]) -> pd.DataFrame:
    """
    Extract main cost type rows for a single project. Values in millions.
    """
    rows = []
    for ct in proj.get("costline_increases_trajectory", []):
        rows.append({
            "category": ct.get("category", ""),
            "file1_metric": round(ct.get("file1_metric", 0.0) / 1000, 3),
            "file2_metric": round(ct.get("file2_metric", 0.0) / 1000, 3),
            "difference": round(ct.get("difference", 0.0) / 1000, 3),
        })
    df = pd.DataFrame(rows)
    if not df.empty:
        df = df.sort_values("difference", ascending=False).reset_index(drop=True)
    return df


def subcategories_df(proj: Dict[str, Any]) -> pd.DataFrame:
    """
    Extract subcategory rows grouped by main cost type. Values in millions.
    """
    rows = []
    for ct in proj.get("costline_increases_trajectory", []):
        main_label = ct.get("category", "")
        for sub in ct.get("subcategories", []):
            rows.append({
                "main_cost_type": main_label,
                "category": sub.get("category", ""),
                "file1_metric": round(sub.get("file1_metric", 0.0) / 1000, 3),
                "file2_metric": round(sub.get("file2_metric", 0.0) / 1000, 3),
                "difference": round(sub.get("difference", 0.0) / 1000, 3),
            })
    df = pd.DataFrame(rows)
    if not df.empty:
        df = df.sort_values("difference", ascending=False).reset_index(drop=True)
    return df


def children_df(proj: Dict[str, Any]) -> pd.DataFrame:
    """
    Extract child (sub-subcategory) rows grouped by main cost type and subcategory.
    Values in millions.
    """
    rows = []
    for ct in proj.get("costline_increases_trajectory", []):
        main_label = ct.get("category", "")
        for sub in ct.get("subcategories", []):
            sub_label = sub.get("category", "")
            for child in sub.get("children", []):
                rows.append({
                    "main_cost_type": main_label,
                    "subcategory": sub_label,
                    "category": child.get("category", ""),
                    "file1_metric": round(child.get("file1_metric", 0.0) / 1000, 3),
                    "file2_metric": round(child.get("file2_metric", 0.0) / 1000, 3),
                    "difference": round(child.get("difference", 0.0) / 1000, 3),
                })
    df = pd.DataFrame(rows)
    if not df.empty:
        df = df.sort_values("difference", ascending=False).reset_index(drop=True)
    return df


# ---------------------------------------------------------------------------
# Main builder
# ---------------------------------------------------------------------------

def build_excel_cost_breakdown(
    projects_df: pd.DataFrame,
    projects: Dict[str, Any],
) -> bytes:
    """
    Build a multi-sheet Excel workbook in memory and return raw bytes.

    Sheet layout:
        Projects              — all-projects summary (sorted by |difference| desc)
        {job_no}_main_types  — main cost type breakdown per project
        {job_no}_costlines   — subcategory breakdown per project
        {job_no}_children    — sub-subcategory breakdown per project

    Empty DataFrames produce no sheet. Sheet names truncated to 31 chars.
    """
    buf = io.BytesIO()

    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        # Summary sheet
        if not projects_df.empty:
            projects_df.to_excel(writer, sheet_name="Projects", index=False)
            logger.debug(f"Wrote Projects sheet with {len(projects_df)} rows")

        # Per-project detail sheets
        for job_no, proj in projects.items():
            df_main = main_costtypes_df(proj)
            if not df_main.empty:
                sheet = f"{job_no}_main_types"[:31]
                df_main.to_excel(writer, sheet_name=sheet, index=False)
                logger.debug(f"Wrote sheet '{sheet}' with {len(df_main)} rows")

            df_sub = subcategories_df(proj)
            if not df_sub.empty:
                sheet = f"{job_no}_costlines"[:31]
                df_sub.to_excel(writer, sheet_name=sheet, index=False)
                logger.debug(f"Wrote sheet '{sheet}' with {len(df_sub)} rows")

            df_ch = children_df(proj)
            if not df_ch.empty:
                sheet = f"{job_no}_children"[:31]
                df_ch.to_excel(writer, sheet_name=sheet, index=False)
                logger.debug(f"Wrote sheet '{sheet}' with {len(df_ch)} rows")

    return buf.getvalue()
