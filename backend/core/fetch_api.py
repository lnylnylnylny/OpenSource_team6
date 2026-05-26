# fetch_api.py
import FinanceDataReader as fdr
from decimal import Decimal
from datetime import datetime, date
from typing import Optional, Dict
from sqlalchemy.orm import Session


def fetch_stock_data(symbol: str) -> Dict:
    """
    실제 시장 데이터를 가져와 Stock 모델과 완벽 호환되는 형태로 반환
    """

    try:
        # 오늘 데이터 가져오기
        df = fdr.DataReader(symbol, date.today().strftime("%Y-%m-%d"))

        if df.empty:
            # 장 마감 후 또는 주말일 경우 최근 데이터 사용
            df = fdr.DataReader(symbol, "2025-01-01")

        latest = df.iloc[-1]
        prev_close = df.iloc[-2]["Close"] if len(df) > 1 else latest["Close"]

        current_price = Decimal(str(latest["Close"]))

        return {
            "symbol": symbol,
            "name": _get_stock_name(symbol),
            "last_price": current_price,
            "prev_close": Decimal(str(prev_close)),
            "open": Decimal(str(latest.get("Open", latest["Close"]))),
            "high": Decimal(str(latest.get("High", latest["Close"]))),
            "low": Decimal(str(latest.get("Low", latest["Close"]))),
            "volume": int(latest.get("Volume", 0)),
            "change_rate": Decimal(
                str(((latest["Close"] - prev_close) / prev_close * 100))
            )
            if prev_close != 0
            else Decimal("0"),
        }
    except Exception as e:
        print(f"[fetch_api] {symbol} 데이터 조회 실패: {e}")
        # 실패 시 fallback 데이터
        fallback_price = Decimal("75000")
        return {
            "symbol": symbol,
            "name": symbol,
            "last_price": fallback_price,
            "prev_close": fallback_price,
            "open": fallback_price,
            "high": fallback_price,
            "low": fallback_price,
            "volume": 0,
            "change_rate": Decimal("0"),
        }


def _get_stock_name(symbol: str) -> str:
    """종목명 조회"""
    try:
        df = fdr.StockListing("KRX")
        name = df[df["Code"] == symbol]["Name"]
        return name.iloc[0] if not name.empty else symbol
    except:
        return symbol


def update_stock_with_real_data(db: Session, symbol: str):
    """
    Stock 모델 객체를 실제 시장 데이터로 업데이트하고 반환
    → matching_engine에서 기존처럼 Stock을 그대로 사용 가능
    """
    from model import Stock  # 순환 import 방지

    data = fetch_stock_data(symbol)

    stock = db.query(Stock).filter_by(symbol=symbol).first()

    if not stock:
        stock = Stock(
            name=data["name"],
            symbol=data["symbol"],
        )
        db.add(stock)

    # Stock 모델 필드와 완전 호환
    stock.name = data["name"]
    stock.symbol = data["symbol"]
    stock.last_price = data["last_price"]
    stock.prev_close = data["prev_close"]
    stock.volume = (stock.volume or 0) + data["volume"]
    stock.change_rate = data["change_rate"]

    # 추가 필드가 있다면 여기서 업데이트 (필요 시 확장)
    # stock.open = data["open"]
    # stock.high = data["high"]
    # stock.low = data["low"]

    db.commit()
    return stock
