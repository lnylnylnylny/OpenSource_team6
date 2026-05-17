# routers/stocks.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from model import Stock  # 위에 정의된 모델

router = APIRouter(prefix="/stocks", tags=["stocks"])


class StockResponse(BaseModel):
    id: int
    code: str
    name: str
    market: str
    asset_type: str
    last_price: float | None
    change_rate: float | None
    volume: int
    market_cap: int | None
    is_active: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=List[StockResponse])
def get_stocks(
    market: Optional[str] = Query(None, description="KOSPI, KOSDAQ 등"),
    search: Optional[str] = Query(None, description="종목명 또는 코드 검색"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Stock).filter(Stock.is_active == True)
    
    if market:
        query = query.filter(Stock.market == market)
    if search:
        query = query.filter(
            (Stock.name.ilike(f"%{search}%")) | (Stock.code.ilike(f"%{search}%"))
        )
    
    return query.offset(skip).limit(limit).all()


@router.get("/{code}", response_model=StockResponse)
def get_stock(code: str, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.code == code).first()
    if not stock:
        raise HTTPException(404, "종목을 찾을 수 없습니다")
    return stock