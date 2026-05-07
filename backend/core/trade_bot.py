# liquidity_bot.py
import asyncio
import random
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session

from model import Order, Trade, Stock
from core.trade_system import MatchingEngine
from database import SessionLocal


class TradeBot:
    def __init__(self):
        self.matching_engine = MatchingEngine()
        self.is_running = False

        # === 추세 관리 ===
        self.current_trend = 0  # -5 ~ +5 (음수=하락, 양수=상승)
        self.trend_strength = 1.0  # 추세 강도
        self.trend_duration = 0  # 현재 추세 지속 시간

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        print("🚀 Trade Bot 시작 - **추세 모드** 활성화")

        while self.is_running:
            db: Session = None
            try:
                db = SessionLocal()
                stocks = db.query(Stock).all()
                for stock in stocks:
                    await self._simulate_trending_market(db, stock.id)

                # 2~9초마다 실행 (더 자연스럽게)
                await asyncio.sleep(random.uniform(2, 9))
            except Exception as e:
                print(f"Trade Bot Error: {e}")
                await asyncio.sleep(5)
            finally:
                if db:
                    db.close()

    async def stop(self):
        self.is_running = False
        print("⛔ Trade Bot 정지")

    async def _simulate_trending_market(self, db: Session, stock_id: int):
        stock = db.query(Stock).get(stock_id)
        if not stock:
            return
        if not stock.last_price:
            stock.last_price = Decimal("10000")
            db.commit()

        current_price = stock.last_price

        # ==================== 추세 업데이트 ====================
        self._update_trend()

        # ==================== 주문 생성 (추세 반영) ====================
        if random.random() < 0.75:  # 75% 확률로 주문
            side = self._get_trend_biased_side()

            # 추세 방향으로 가격 편향
            bias = self.current_trend * Decimal("30")  # 추세 강할수록 더 강하게
            volatility = Decimal("0.006")  # 기본 변동성

            price_change = (
                current_price * volatility * Decimal(random.uniform(-1.0, 1.0))
            )
            order_price = (current_price + price_change + bias).quantize(Decimal("1"))

            # 가격 하한/상한
            order_price = max(Decimal("1000"), min(Decimal("100000"), order_price))

            volume = random.randint(40, 280)

            dummy_order = Order(
                user_id=9991,
                stock_id=stock_id,
                side=side,
                order_type="LIMIT",
                price=order_price,
                volume=volume,
                status="PENDING",
                created_at=datetime.now(),
            )
            db.add(dummy_order)
            db.commit()
            db.refresh(dummy_order)

            print(f"🤖 Bot [{self._trend_name()}] {side} {volume}주 @ {order_price}")

            # 매칭 실행
            await self.matching_engine.match_orders(db, stock_id)

        # ==================== 강제 체결 (추세 가속) ====================
        if random.random() < 0.35:  # 35% 확률로 강한 움직임
            await self._force_trend_trade(db, stock_id, current_price)

    def _update_trend(self):
        """추세를 서서히 변화시킴"""
        self.trend_duration += 1

        # 일정 시간 후 추세 전환 확률
        if self.trend_duration > random.randint(15, 40):
            if random.random() < 0.6:  # 60% 확률로 추세 변경
                self.current_trend = random.randint(-5, 5)
                self.trend_strength = random.uniform(0.7, 1.8)
                self.trend_duration = 0
                print(
                    f"📈 추세 변경 → {self._trend_name()} (강도: {self.trend_strength:.1f})"
                )

    def _get_trend_biased_side(self) -> str:
        """추세에 따라 매수/매도 비중 조절"""
        if self.current_trend > 1:
            return "BUY" if random.random() < 0.75 else "SELL"
        elif self.current_trend < -1:
            return "SELL" if random.random() < 0.75 else "BUY"
        else:
            return "BUY" if random.random() > 0.5 else "SELL"

    def _trend_name(self) -> str:
        if self.current_trend >= 3:
            return "강한 상승"
        elif self.current_trend >= 1:
            return "상승"
        elif self.current_trend <= -3:
            return "강한 하락"
        elif self.current_trend <= -1:
            return "하락"
        else:
            return "보합"

    async def _force_trend_trade(
        self, db: Session, stock_id: int, current_price: Decimal
    ):
        """추세 방향으로 강한 체결 발생"""
        volume = random.randint(60, 220)

        # 추세 방향으로 가격 이동
        direction = 1 if self.current_trend >= 0 else -1
        price_move = (
            Decimal(random.uniform(30, 120)) * direction * Decimal(self.trend_strength)
        )
        trade_price = (current_price + price_move).quantize(Decimal("1"))

        buy_order = Order(
            user_id=9991,
            side="BUY",
            order_type="LIMIT",
            stock_id=stock_id,
            price=trade_price,
            volume=volume,
            status="PENDING",
        )
        sell_order = Order(
            user_id=9992,
            side="SELL",
            order_type="LIMIT",
            stock_id=stock_id,
            price=trade_price,
            volume=volume,
            status="PENDING",
        )

        db.add(buy_order)
        db.add(sell_order)
        db.commit()

        trade = Trade(
            buy_order_id=buy_order.id,
            sell_order_id=sell_order.id,
            stock_id=stock_id,
            price=trade_price,
            volume=volume,
            trade_time=datetime.now(),
        )
        db.add(trade)
        db.commit()

        await self.matching_engine.match_orders(db, stock_id)
        print(f"🔥 강제 추세 체결: {volume}주 @ {trade_price} ({self._trend_name()})")

    async def create_instant_counter_order(
        self, db: Session, stock_id: int, user_order
    ):
        """실제 유저가 주문 넣었을 때 → 바로 반대쪽 더미 주문 만들어 체결 유도"""

        dummy_user_id = random.choice([9991, 9992, 9993])

        if user_order.side == "BUY":
            side = "SELL"
            # 유저 매수가격 근처 또는 조금 높게
            price = (
                user_order.price or (user_order.price + Decimal("20"))
                if user_order.price
                else Decimal("10500")
            )
        else:
            side = "BUY"
            price = (
                user_order.price or (user_order.price - Decimal("20"))
                if user_order.price
                else Decimal("9500")
            )

        # 가격을 유저 주문과 최대한 가깝게 조정
        if user_order.price:
            if side == "SELL":
                price = max(user_order.price - Decimal("30"), Decimal("1000"))
            else:
                price = min(user_order.price + Decimal("30"), Decimal("100000"))

        volume = min(user_order.volume, random.randint(80, 400))  # 충분한 물량

        dummy_order = Order(
            user_id=dummy_user_id,
            stock_id=stock_id,
            side=side,
            order_type="LIMIT",
            price=price,
            volume=volume,
            status="PENDING",
            created_at=datetime.now(),
        )
        db.add(dummy_order)
        db.commit()
        db.refresh(dummy_order)

        print(
            f"⚡ 즉시 반대 주문 생성: {side} {volume}주 @ {price} (유저 {user_order.side} 주문 대응)"
        )

        # 바로 매칭 실행
        await self.matching_engine.match_orders(db, stock_id)

        return dummy_order


trade_bot = TradeBot()


def get_trade_bot():
    return trade_bot
