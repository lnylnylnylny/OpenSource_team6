# routers/quotes.py
from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from pydantic import BaseModel

from database import get_db
from model import Quote, Stock

router = APIRouter(prefix="/quotes", tags=["quotes"])


class QuoteResponse(BaseModel):
    quote_time: datetime
    open_price: float
    high_price: float
    low_price: float
    close_price: float
    volume: int
    change_rate: float | None

    class Config:
        from_attributes = True


@router.get("/{code}/latest")
def get_latest_quote(code: str, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.code == code).first()
    if not stock:
        raise HTTPException(404, "종목 없음")
    
    latest = db.query(Quote)\
        .filter(Quote.stock_id == stock.id)\
        .order_by(Quote.quote_time.desc())\
        .first()
    
    return latest


@router.get("/{code}/history", response_model=List[QuoteResponse])
def get_quote_history(
    code: str,
    interval: str = Query("1d", enum=["1m", "5m", "15m", "1h", "1d"]),
    days: int = Query(30, le=365),
    db: Session = Depends(get_db)
):
    stock = db.query(Stock).filter(Stock.code == code).first()
    if not stock:
        raise HTTPException(404, "종목 없음")
    
    start_date = datetime.now() - timedelta(days=days)
    
    query = db.query(Quote).filter(
        Quote.stock_id == stock.id,
        Quote.quote_time >= start_date
    ).order_by(Quote.quote_time)
    
    return query.all()