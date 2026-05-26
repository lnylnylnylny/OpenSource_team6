# routers/quotes.py
from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from model import Quote, Stock
from core.fetch_api import fetch_stock_data  # 실시간 보완용

router = APIRouter(prefix="/quotes", tags=["quotes"])


class QuoteResponse(BaseModel):
    quote_time: datetime
    open_price: Optional[float] = None
    high_price: Optional[float] = None
    low_price: Optional[float] = None
    close_price: Optional[float] = None
    volume: int = 0
    change_rate: Optional[float] = None

    class Config:
        from_attributes = True


@router.get("/{symbol}/latest", response_model=QuoteResponse)
def get_latest_quote(symbol: str, db: Session = Depends(get_db)):
    """최신 Quote 조회 (symbol 또는 id 지원)"""
    stock = _get_stock_by_symbol_or_id(symbol, db)
    if not stock:
        raise HTTPException(status_code=404, detail="종목을 찾을 수 없습니다")

    latest = (
        db.query(Quote)
        .filter(Quote.stock_id == stock.id)
        .order_by(Quote.quote_time.desc())
        .first()
    )

    if not latest:
        # Quote가 없으면 실시간 데이터로 즉시 생성
        try:
            data = fetch_stock_data(stock.symbol)
            latest = Quote(
                stock_id=stock.id,
                open_price=float(data["open"]),
                high_price=float(data["high"]),
                low_price=float(data["low"]),
                close_price=float(data["last_price"]),
                volume=data["volume"],
                quote_time=datetime.now(timezone.utc),
                change_rate=float(data["change_rate"]),
            )
            db.add(latest)
            db.commit()
        except:
            raise HTTPException(
                status_code=404, detail="Quote 데이터를 찾을 수 없습니다"
            )

    return latest


@router.get("/{symbol}/history", response_model=List[QuoteResponse])
def get_quote_history(
    symbol: str,
    interval: str = Query("1d", enum=["1m", "5m", "15m", "1h", "1d"]),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """과거 Quote 히스토리 조회"""
    stock = _get_stock_by_symbol_or_id(symbol, db)
    if not stock:
        raise HTTPException(status_code=404, detail="종목을 찾을 수 없습니다")

    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    query = (
        db.query(Quote)
        .filter(Quote.stock_id == stock.id, Quote.quote_time >= start_date)
        .order_by(Quote.quote_time.asc())
    )

    quotes = query.all()

    # 데이터가 부족한 경우 실시간 데이터로 보완
    if not quotes:
        try:
            data = fetch_stock_data(stock.symbol)
            return [
                QuoteResponse(
                    quote_time=datetime.now(timezone.utc),
                    open_price=float(data["open"]),
                    high_price=float(data["high"]),
                    low_price=float(data["low"]),
                    close_price=float(data["last_price"]),
                    volume=data["volume"],
                    change_rate=float(data["change_rate"]),
                )
            ]
        except:
            pass

    return quotes


@router.get("/{symbol}/refresh", response_model=QuoteResponse)
def refresh_quote(symbol: str, db: Session = Depends(get_db)):
    """특정 종목의 Quote를 실시간으로 강제 업데이트"""
    stock = _get_stock_by_symbol_or_id(symbol, db)
    if not stock:
        raise HTTPException(status_code=404, detail="종목을 찾을 수 없습니다")

    data = fetch_stock_data(stock.symbol)

    # 최신 Quote 생성 또는 업데이트
    new_quote = Quote(
        stock_id=stock.id,
        open_price=float(data["open"]),
        high_price=float(data["high"]),
        low_price=float(data["low"]),
        close_price=float(data["last_price"]),
        volume=data["volume"],
        quote_time=datetime.now(timezone.utc),
        change_rate=float(data["change_rate"]),
    )
    db.add(new_quote)
    db.commit()

    return new_quote


# ==================== 내부 헬퍼 함수 ====================
def _get_stock_by_symbol_or_id(identifier: str, db: Session) -> Optional[Stock]:
    """symbol 또는 id로 Stock 조회"""
    # symbol로 먼저 검색
    stock = db.query(Stock).filter(Stock.symbol == identifier).first()

    # 숫자라면 id로도 시도
    if not stock and identifier.isdigit():
        stock = db.query(Stock).filter(Stock.id == int(identifier)).first()

    return stock
