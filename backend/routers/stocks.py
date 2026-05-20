# routers/stocks.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from model import Stock
from core.fetch_api import fetch_stock_data  # 실시간 데이터 보완용
from core.trade_system import get_matching_engine

router = APIRouter(prefix="/stocks", tags=["stocks"])

matching_engine = get_matching_engine()

class StockResponse(BaseModel):
    id: int
    symbol: str
    name: str
    market: Optional[str] = None
    asset_type: Optional[str] = None
    last_price: Optional[float] = None
    change_rate: Optional[float] = None
    volume: int = 0
    market_cap: Optional[int] = None
    is_active: bool = True

    class Config:
        from_attributes = True


@router.get("/", response_model=List[StockResponse])
def get_stocks(
    market: Optional[str] = Query(None, description="KOSPI, KOSDAQ 등"),
    search: Optional[str] = Query(None, description="종목명 또는 심볼 검색"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(Stock).filter(Stock.is_active == True)

    if market:
        query = query.filter(Stock.market == market.upper())

    if search:
        query = query.filter(
            (Stock.name.ilike(f"%{search}%")) | (Stock.symbol.ilike(f"%{search}%"))
        )

    stocks = query.offset(skip).limit(limit).all()

    # 실시간 가격 보완 (필요한 경우)
    for stock in stocks:
        if stock.last_price is None or stock.last_price == 0:
            try:
                data = fetch_stock_data(stock.id)
                stock.last_price = float(data["last_price"])
                stock.change_rate = float(data["change_rate"])
                stock.volume = data["volume"]
            except:
                pass  # 실패해도 기존 데이터 유지

    return stocks


@router.get("/{symbol}", response_model=StockResponse)
async def get_stock(symbol: str, db: Session = Depends(get_db)):
    """symbol (예: 005930) 또는 id로 조회 가능"""
    # symbol로 먼저 찾기
    stock = db.query(Stock).filter(Stock.symbol == symbol).first()

    # symbol이 숫자라면 id로도 시도
    if not stock and symbol.isdigit():
        stock = db.query(Stock).filter(Stock.id == int(symbol)).first()

    if not stock:
        raise HTTPException(status_code=404, detail="종목을 찾을 수 없습니다")

    await matching_engine.start(db, stock.symbol)

    return stock


@router.get("/{symbol}/refresh", response_model=StockResponse)
async def refresh_stock_data(symbol: str, db: Session = Depends(get_db)):
    """특정 종목의 실시간 데이터를 강제 업데이트"""
    stock = db.query(Stock).filter(Stock.symbol == symbol).first()
    if not stock and symbol.isdigit():
        stock = db.query(Stock).filter(Stock.id == int(symbol)).first()

    await matching_engine.start(db, symbol)

    if not stock:
        return {
            'status': 'OK'
        }
    return stock
