# matching_engine.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from datetime import datetime, timedelta, timezone
import asyncio
from typing import Optional

from core.fetch_api import update_stock_with_real_data, fetch_stock_data
from model import (
    Order,
    Stock,
    UserBalance,
    UserHolding,
    Transaction,
)

BOT_USER_IDS = {9991, 9992, 9993}


class MatchingEngine:
    def __init__(self):
        self.lock = asyncio.Lock()
        self.running = False
        self.tasks = {}  # stock_id별 백그라운드 태스크 관리

    async def start(self, db: Session, symbol: str):
        """특정 종목에 대해 30초마다 실제 시장 데이터 업데이트"""
        if symbol in self.tasks and not self.tasks[symbol].done():
            print(f"[MarketData] Stock {symbol} 이미 실행 중")
            return

        self.running = True
        task = asyncio.create_task(self._market_data_loop(db, symbol))
        self.tasks[symbol] = task
        print(f"[MarketData] Stock {symbol} 실시간 데이터 업데이트 시작 (30초 주기)")

    async def stop(self, symbol: Optional[str] = None):
        """특정 종목 또는 전체 정지"""
        if symbol:
            if symbol in self.tasks:
                self.tasks[symbol].cancel()
                await asyncio.sleep(0.1)
                self.tasks.pop(symbol, None)
                print(f"[MarketData] Stock {symbol} 업데이트 정지")
        else:
            for task in self.tasks.values():
                task.cancel()
            self.tasks.clear()
            self.running = False
            print("[MarketData] 모든 종목 데이터 업데이트 정지")

    async def _market_data_loop(self, db: Session, symbol: str):
        """30초마다 실제 시장 데이터 반영"""
        while self.running:
            try:
                async with self.lock:
                    # 실제 시장 데이터로 Stock 업데이트
                    stock = update_stock_with_real_data(db, symbol)

                    # 최신 데이터 한 번 더 확인 (fallback)
                    data = fetch_stock_data(symbol)
                    stock.last_price = data["last_price"]
                    stock.change_rate = data["change_rate"]
                    stock.volume = (stock.volume or 0) + data["volume"]

                    db.commit()

                    print(
                        f"[MarketData] ✅ Stock {symbol} 업데이트 완료 | "
                        f"가격: {stock.last_price:,} | 변동률: {stock.change_rate:+.2f}% | "
                        f"시간: {datetime.now().strftime('%H:%M:%S')}"
                    )

            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[MarketData ERROR] Stock {symbol}: {e}")
                await asyncio.sleep(5)  # 에러 시 잠시 대기 후 재시도

            await asyncio.sleep(30)  # 30초 주기

    # ==================== 기존 매칭 관련 메서드는 더 이상 사용되지 않음 ====================
    # 필요 시 나중에 다시 활성화할 수 있도록 주석 처리

    def _cancel_expired_orders(self, db: Session, stock_id: int):
        """(현재 비활성화) 필요 시 사용"""
        pass

    def _get_active_orders(self, db: Session, stock_id: int, side: str):
        return None

    def _process_trade(self, *args, **kwargs):
        pass

    def _update_holding(self, *args, **kwargs):
        pass

    def _update_market_price(self, *args, **kwargs):
        pass

    def _log_transactions(self, *args, **kwargs):
        pass


# ==================== 싱글톤 ====================
_engine_instance: Optional["MatchingEngine"] = None


def get_matching_engine() -> "MatchingEngine":
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = MatchingEngine()
    return _engine_instance
