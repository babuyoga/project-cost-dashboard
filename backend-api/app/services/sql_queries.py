"""
SQL Queries Module

This module contains the SQL query templates and database query functions
for fetching financial data from SQL Server. The main query retrieves
project cost data including forecasts, actuals, and cost breakdowns.
"""

import pandas as pd
from sqlalchemy.orm import Session

# =============================================================================
# Base SQL Query
# This complex query joins multiple tables to get comprehensive project data:
# - Ac_JcPackageDt: Package detail lines (costs)
# - Ac_JcPackageHd: Package headers
# - Ac_JcPackageSub: Sub-packages for detailed breakdowns
# - Ac_Client: Client information
# - Ac_Currency: Currency details
# - Ac_JcMajor: Major segment descriptions
# - Ac_JcPackage: Package/annex info
# - Ac_JcTypeCode: Cost type descriptions
# - Ac_JcBook: Book descriptions
# =============================================================================
base_sql = """Declare @cBook char(6)='ALL'
        DECLARE @cPeriod char(6)= ?
        DECLARE @segment int = 0 --Set @segment=5141 5001
        DECLARE @iRevNo char(3) ='ALL'
        DECLARE @iProjNo int = 0
        DECLARE @iProjYr int = 0
        DECLARE @Manager tinyint =0
        Declare @ExcludePack  char(3) ='ALL'
        Declare @chkShowClime  char(3) ='0'
        Declare @lcVariation  Nvarchar(10)=''

            if right(@segment, 1) = '1'
            Set    @lcVariation = left(@segment, 3) + '2'
            
            IF OBJECT_ID('tempdb..#tempresult') IS NOT NULL DROP TABLE #tempresult;
        select * into #tempresult from
        (SELECT case when  @cBook='ALL' then 'AUH' else  a.cBook end cBook, a.iProjYear, a.iProjNo, a.cSegment, a.cPackage, a.cPeriod, a.cElementCode,(g.cPackage + ' - ' + g.cSubDesc1) TYP, a.cType, a.iWidth, a.rMthBud,
            a.rMthAct, a.rYearBud, a.rYearBTD, a.rYearAct, a.rYearFrc, a.rPTDBud, a.rPTDAct, a.rOrgBud, a.rRevBud,
            a.rForecast, a.rRateBud, a.rRateFrc, a.rVariance, a.rVarianceChange, l.lCargoBarge,
            (round(a.rForecast,0) -round( a.rLastMonthStcFrc,0)) AS rForecastChange, a.rPercCompl, a.cSubDesc2, a.cSubDesc3, b.lCommitted,
            c.iCurrCode, c.cClient, c.cProjDesc, c.cProjMgr, d.cClientDesc, c.cFirstFrcPeriod,
            e.cCurrAbrv, e.rCurrRate, e.cCurrDesc, f.cDesc as cMajorDesc, g.cAnnex, j.cDesc as cMainDesc, case when  @cBook='ALL' then 'Abu Dhabi' else  k.cBookDesc end cBookDesc
        FROM Ac_JcPackageDt a (NoLock)
        inner join  Ac_JcPackageHd b (NoLock) on a.cBook = b.cBook AND a.iProjYear = b.iProjYear AND a.iProjNo = b.iProjNo AND a.cSegment = b.cSegment AND a.cPackage = b.cPackage AND a.cPeriod = b.cPeriod
        inner join   Ac_JcBudControl c (NoLock) on  a.cBook = c.cBook AND a.iProjYear = c.iProjYear AND a.iProjNo = c.iProjNo AND c.cProjType = 'C'
        left outer join  vwac_Clients d on c.cClient = d.cClientCode
        left outer join       Mm_Currency e (Nolock) on c.iCurrCode = e.iCurrCode
        left outer join        Ac_MainCenter f (NoLock) on  a.cSegment = f.cMajor
        inner join       Ac_JcPackageRef g (NoLock) on  a.cPackage = g.cPackage 
        left outer join    Ac_JcBudControlDetail h (NoLock) on  a.cBook = h.cBook AND a.iProjYear = h.iProjYear AND a.iProjNo = h.iProjNo and a.cSegment = h.cSegment AND h.cProjType = 'C'
        left outer join       Ac_ArSegment j (NoLock) on a.cSegment = j.cCoCode
        left outer join        Cs_Book k (NoLock) on  c.cBook = k.cBook
        left outer join               Ac_JcResources l (NoLock) on  a.cElementCode =l.cResource
        left join  AC_JcMgrSegPack m (Nolock)  on a.cSegment = m.cSegment AND a.cPackage = m.cPackage AND SUBSTRING(a.cElementCode, 1, 2) = m.cCode
        WHERE 
         f.cCompany ='N'
        AND 
	   (
	     (@cBook='ALL')
		 OR
	     (@cBook <> 'ALL' and a.cBook =@cBook)
	   )
       AND a.iProjYear =case when @iProjYr=0 then a.iProjYear else @iProjYr end
       AND a.iProjNo = case when @iProjNo=0 then a.iProjNo else  @iProjNo end
       AND a.cPeriod = @cPeriod
       AND a.cSegment =  case when @segment= 0 then a.cSegment   else   @segment  end 
	   AND  
	   (
	   (@Manager =1 AND a.cSegment = m.cSegment AND a.cPackage = m.cPackage AND SUBSTRING(a.cElementCode, 1, 2) = m.cCode AND  m.iCode=@Manager)
	   or 
	    ( @Manager =0))	   
       AND
	   (( (@Manager =1  AND @segment=0 )  OR  ISNULL(@lcVariation,'')<>'')  AND RIGHT(a.cSegment, 1) <> '2'
	or
		(@Manager =0))
	  AND 	  	  
	  (@iRevNo='ALL' AND  a.cPackage NOT IN ('92','93')
	  OR
       ( a.cPackage = @iRevNo)
	  ))  a        where (a.rMthBuD <> 0 or a.rMthAct <> 0 or a.rYearBud <> 0 or a.rYearBTD <> 0 or a.rYearAct <> 0 or a.rYearFrc <> 0 or a.rPTDBud <> 0 or a.rPTDAct <> 0 or a.rOrgBud <> 0  or a.rRevBud <> 0 or a.rForecast <> 0  or a.rVariance <> 0 or a.rForecastChange <> 0 )
	  if ISNULL(@lcVariation,'')<>''
     BEGIN
	  IF OBJECT_ID('tempdb..#tempresultunion') IS NOT NULL DROP TABLE #tempresultunion;
	   select * into #tempresultunion from
      (SELECT case when  @cBook='ALL' then 'AUH' else  a.cBook end cBook, a.iProjYear, a.iProjNo, a.cSegment, a.cPackage, a.cPeriod, a.cElementCode,(g.cPackage + ' - ' + g.cSubDesc1) TYP, a.cType, a.iWidth, a.rMthBud,
		a.rMthAct, a.rYearBud, a.rYearBTD, a.rYearAct, a.rYearFrc, a.rPTDBud, a.rPTDAct, a.rOrgBud, a.rRevBud,
		a.rForecast, a.rRateBud, a.rRateFrc, a.rVariance, a.rVarianceChange, l.lCargoBarge,
		 (round(a.rForecast,0) -round( a.rLastMonthStcFrc,0)) AS rForecastChange, a.rPercCompl, a.cSubDesc2, a.cSubDesc3, b.lCommitted,
		 c.iCurrCode, c.cClient, c.cProjDesc, c.cProjMgr, d.cClientDesc, c.cFirstFrcPeriod,
		e.cCurrAbrv, e.rCurrRate, e.cCurrDesc, f.cDesc as cMajorDesc, g.cAnnex, j.cDesc as cMainDesc, case when  @cBook='ALL' then 'Abu Dhabi' else  k.cBookDesc end cBookDesc
		FROM Ac_JcPackageDt a (NoLock)
		inner join  Ac_JcPackageHd b (NoLock) on a.cBook = b.cBook AND a.iProjYear = b.iProjYear AND a.iProjNo = b.iProjNo AND a.cSegment = b.cSegment AND a.cPackage = b.cPackage AND a.cPeriod = b.cPeriod
		inner join   Ac_JcBudControl c (NoLock) on  a.cBook = c.cBook AND a.iProjYear = c.iProjYear AND a.iProjNo = c.iProjNo AND c.cProjType = 'C'
		left outer join  vwac_Clients d on c.cClient = d.cClientCode left outer join       Mm_Currency e (Nolock) on c.iCurrCode = e.iCurrCode
		left outer join        Ac_MainCenter f (NoLock) on  a.cSegment = f.cMajor inner join       Ac_JcPackageRef g (NoLock) on  a.cPackage = g.cPackage 
		left outer join    Ac_JcBudControlDetail h (NoLock) on  a.cBook = h.cBook  AND a.iProjYear = h.iProjYear AND a.iProjNo = h.iProjNo and a.cSegment = h.cSegment AND h.cProjType = 'C'
		left outer join       Ac_ArSegment j (NoLock) on a.cSegment = j.cCoCode left outer join        Cs_Book k (NoLock) on  c.cBook = k.cBook
		left outer join               Ac_JcResources l (NoLock) on  a.cElementCode =l.cResource
		left join  AC_JcMgrSegPack m (Nolock)  on a.cSegment = m.cSegment AND a.cPackage = m.cPackage AND SUBSTRING(a.cElementCode, 1, 2) = m.cCode 
		WHERE 
			f.cCompany ='N'
			 AND 
			   (
			     (@cBook='ALL')
			 OR
		     (@cBook <> 'ALL' and a.cBook =@cBook)
			   )
       AND a.iProjYear =case when @iProjYr=0 then a.iProjYear else @iProjYr end
       AND a.iProjNo = case when @iProjNo=0 then a.iProjNo else  @iProjNo end
    AND a.cPeriod = @cPeriod
			AND
			(
			( isnull( @lcVariation,'') <> '' and a.cSegment = @lcVariation)
			OR
			(@lcVariation=0
			))   AND RIGHT(a.cSegment, 1) = '2'	AND 	  	  
		(@iRevNo='ALL' AND  a.cPackage NOT IN ('92','93')
		OR
		( a.cPackage = @iRevNo)
		) ) a        where (a.rMthBuD <> 0 or a.rMthAct <> 0 or a.rYearBud <> 0 or a.rYearBTD <> 0 or a.rYearAct <> 0 or a.rYearFrc <> 0 or a.rPTDBud <> 0 or a.rPTDAct <> 0 or a.rOrgBud <> 0  or a.rRevBud <> 0 or a.rForecast <> 0  or a.rVariance <> 0 or a.rForecastChange <> 0 )		 
	end
				if ( @Manager =1 AND @segment=0)   OR  ISNULL(@lcVariation,'')<>''
			Begin
				select cBook,	iProjYear,	iProjNo,	cSegment,	cPackage,	cPeriod,	cElementCode,	TYP,	cType,	iWidth,
				sum(rMthBud) rMthBud,sum(rMthAct)rMthAct,sum(rYearBud) rYearBud,sum(rYearBTD) rYearBTD, sum(rYearAct) rYearAct,sum(rYearFrc) rYearFrc,sum(rPTDBud) rPTDBud, 
				sum(rPTDAct) rPTDAct, sum(rOrgBud) rOrgBud,sum(rRevBud) rRevBud,sum(rForecast) rForecast,sum(rRateBud) rRateBud,sum(rRateFrc) rRateFrc,sum(rVariance) rVariance,sum(rVarianceChange) rVarianceChange,
				sum(rForecastChange) rForecastChange,sum(rPercCompl) rPercCompl,	cSubDesc2,	cSubDesc3,	lCommitted,	iCurrCode,	cClient,	cProjDesc,	cProjMgr,	cClientDesc,	cFirstFrcPeriod	,cCurrAbrv,
				rCurrRate,	cCurrDesc,	cMajorDesc,	cAnnex	,cMainDesc,	cBookDesc 
				from #tempresult where 1=1 and ( (isnull(@ExcludePack,'ALL')<>'ALL' and cPackage not in ( @ExcludePack)) OR  ((isnull(@ExcludePack,'ALL')= 'ALL' and  cPackage=cPackage)))
			and ((@chkShowClime=0) or (@chkShowClime=1) and   RIGHT(cSegment, 1) = '2') Group by cBook,	iProjYear,	iProjNo,	cSegment,	cPackage,	cPeriod,	cElementCode,	TYP,	cType,	iWidth,
			cSubDesc2,	cSubDesc3,	lCommitted,	iCurrCode,	cClient,	cProjDesc,	cProjMgr,	cClientDesc,	cFirstFrcPeriod	,cCurrAbrv,	rCurrRate,	cCurrDesc,	cMajorDesc,	cAnnex	,cMainDesc,	cBookDesc
			UNION ALL
				select cBook,	iProjYear,	iProjNo,	cSegment,	cPackage,	cPeriod,	cElementCode,	TYP,	cType,	iWidth,
				sum(rMthBud) rMthBud,sum(rMthAct)rMthAct,sum(rYearBud) rYearBud,sum(rYearBTD) rYearBTD, sum(rYearAct) rYearAct,sum(rYearFrc) rYearFrc,sum(rPTDBud) rPTDBud, 
				sum(rPTDAct) rPTDAct, sum(rOrgBud) rOrgBud,sum(rRevBud) rRevBud,sum(rForecast) rForecast,sum(rRateBud) rRateBud,sum(rRateFrc) rRateFrc,sum(rVariance) rVariance,sum(rVarianceChange) rVarianceChange,
				sum(rForecastChange) rForecastChange,sum(rPercCompl) rPercCompl,	cSubDesc2,	cSubDesc3,	lCommitted,	iCurrCode,	cClient,	cProjDesc,	cProjMgr,	cClientDesc,	cFirstFrcPeriod	,cCurrAbrv,
				rCurrRate,	cCurrDesc,	cMajorDesc,	cAnnex	,cMainDesc,	cBookDesc
				from #tempresultunion where 1=1 and ( (isnull(@ExcludePack,'ALL')<>'ALL' and cPackage not in ( @ExcludePack)) OR  ((isnull(@ExcludePack,'ALL')= 'ALL' and  cPackage=cPackage))) 
				and  ((@chkShowClime=0) or (@chkShowClime=1) and   RIGHT(cSegment, 1) = '2') Group by cBook,	iProjYear,	iProjNo,	cSegment,	cPackage,	cPeriod,	cElementCode,	TYP,	cType,	iWidth,
			cSubDesc2,	cSubDesc3,	lCommitted,	iCurrCode,	cClient,	cProjDesc,	cProjMgr,	cClientDesc,	cFirstFrcPeriod	,cCurrAbrv,	rCurrRate,	cCurrDesc,	cMajorDesc,	cAnnex	,cMainDesc,	cBookDesc
			End
			else
			select cBook,	iProjYear,	iProjNo,	cSegment,	cPackage,	cPeriod,	cElementCode,	TYP,	cType,	iWidth,
				sum(rMthBud) rMthBud,sum(rMthAct)rMthAct,sum(rYearBud) rYearBud,sum(rYearBTD) rYearBTD, sum(rYearAct) rYearAct,sum(rYearFrc) rYearFrc,sum(rPTDBud) rPTDBud, 
				sum(rPTDAct) rPTDAct, sum(rOrgBud) rOrgBud,sum(rRevBud) rRevBud,sum(rForecast) rForecast,sum(rRateBud) rRateBud,sum(rRateFrc) rRateFrc,sum(rVariance) rVariance,sum(rVarianceChange) rVarianceChange,
				sum(rForecastChange) rForecastChange,sum(rPercCompl) rPercCompl,	cSubDesc2,	cSubDesc3,	lCommitted,	iCurrCode,	cClient,	cProjDesc,	cProjMgr,	cClientDesc,	cFirstFrcPeriod	,cCurrAbrv,
				rCurrRate,	cCurrDesc,	cMajorDesc,	cAnnex	,cMainDesc,	cBookDesc
				from #tempresult where 1=1 and ( (isnull(@ExcludePack,'ALL')<>'ALL' and cPackage not in ( @ExcludePack)) OR  ((isnull(@ExcludePack,'ALL')= 'ALL' and  cPackage=cPackage)))
				and  ((@chkShowClime=0) or (@chkShowClime=1) and   RIGHT(cSegment, 1) = '2') Group by cBook,	iProjYear,	iProjNo,	cSegment,	cPackage,	cPeriod,	cElementCode,	TYP,	cType,	iWidth,
			cSubDesc2,	cSubDesc3,	lCommitted,	iCurrCode,	cClient,	cProjDesc,	cProjMgr,	cClientDesc,	cFirstFrcPeriod	,cCurrAbrv,	rCurrRate,	cCurrDesc,	cMajorDesc,	cAnnex	,cMainDesc,	cBookDesc
			"""


def query_batch_to_df(db: Session, period: str) -> pd.DataFrame:
    """
    Execute the main SQL query for a specific period and return results as DataFrame.
    
    This function:
    1. In TEST_MODE: Loads data from XLSX files in the project root
    2. In production: Executes the complex JOIN query against SQL Server
    
    Args:
        db: SQLAlchemy database session (None in test mode)
        period: Period in YYYYMM format (e.g., "202305")
    
    Returns:
        pd.DataFrame: Project cost data with columns like iProjNo, rForecast, etc.
                      Returns empty DataFrame if no data found.
    """
    from app.config import TEST_MODE
    
    if TEST_MODE:
        return _query_from_xlsx(period)
    else:
        return _query_from_database(db, period)


def _query_from_xlsx(period: str) -> pd.DataFrame:
    """
    Load test data from XLSX files based on period.
    
    Maps periods to XLSX files:
    - 202305 -> may2023dummy.xlsx
    - 202312 -> dec2023dummy.xlsx
    
    Args:
        period: Period in YYYYMM format
    
    Returns:
        pd.DataFrame: Test data from XLSX file, or empty DataFrame if not found
    """
    from pathlib import Path
    
    # Map periods to XLSX files
    xlsx_mapping = {
        "202305": "may2023dummy.xlsx",
        "202312": "dec2023dummy.xlsx",
    }
    
    xlsx_file = xlsx_mapping.get(period)
    if not xlsx_file:
        print(f"[TEST MODE] No XLSX file mapped for period {period}")
        print(f"[TEST MODE] Available periods: {list(xlsx_mapping.keys())}")
        return pd.DataFrame()
    
    # Find the XLSX file in the project root
    project_root = Path(__file__).parent.parent.parent
    xlsx_path = project_root / xlsx_file
    
    if not xlsx_path.exists():
        print(f"[TEST MODE] XLSX file not found: {xlsx_path}")
        return pd.DataFrame()
    
    print(f"[TEST MODE] Loading data from: {xlsx_path}")
    df = pd.read_excel(xlsx_path)
    
    # Ensure period column matches the requested period
    # (In case the XLSX has a different period value)
    df["cPeriod"] = period
    
    return df


def _query_from_database(db: Session, period: str) -> pd.DataFrame:
    """
    Execute the SQL query against the real database.
    
    This function:
    1. Executes the complex JOIN query against SQL Server
    2. Uses SET NOCOUNT ON to suppress row count messages
    3. Handles multi-result batch queries by advancing to the data result set
    
    Args:
        db: SQLAlchemy database session
        period: Period in YYYYMM format (e.g., "202301")
    
    Returns:
        pd.DataFrame: Project cost data, or empty DataFrame if no data found.
    """
    sql = "SET NOCOUNT ON;\n" + base_sql
    params = (period,)
    
    # Get raw pyodbc connection from SQLAlchemy session
    conn = db.connection()
    raw_conn = conn.connection  # pyodbc.Connection
    cur = raw_conn.cursor()
    cur.execute(sql, params)
    
    # Advance to the first result set that returns columns
    # (skips SET NOCOUNT and other non-data results)
    while cur.description is None:
        if not cur.nextset():
            return pd.DataFrame()  # no row-returning result sets in this batch

    # Extract column names and data
    cols = [c[0] for c in cur.description]
    rows = cur.fetchall()
    return pd.DataFrame.from_records(rows, columns=cols)

