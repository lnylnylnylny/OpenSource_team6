# matching_engine.py
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from decimal import Decimal
from datetime import datetime, timedelta, timezone
import asyncio
from typing import Optional, Tuple

from model import (
    Order,
    Trade,
    Quote,
    Stock,
    UserBalance,
    UserHolding,
    Transaction,
    User,
)

BOT_USER_IDS = {9991, 9992, 9993}


class MatchingEngine:
    def __init__(self):
        self.lock = asyncio.Lock()  # 동시성 보호 (동일 종목 동시 주문 방지)

    async def match_orders(self, db: Session, stock_id: int):
        """주요 매칭 엔진 진입점"""
        async with self.lock:
            # self._cancel_expired_orders(db, stock_id)

            match_count = 0
            while True:
                buy = self._get_active_orders(db, stock_id, "BUY")
                sell = self._get_active_orders(db, stock_id, "SELL")

                print(
                    f"[MatchingEngine] 매칭 시도 → BUY: {buy.id if buy else 'None'} @ {buy.price if buy else 'N/A'} | SELL: {sell.id if sell else 'None'} @ {sell.price if sell else 'N/A'}"
                )

                if not buy or not sell:
                    break

                # 체결 불가 조건: None 먼저 확인 후 가격 비교
                # if buy.price is None or sell.price is None or buy.price < sell.price:
                #     break

                # 체결 수량 결정
                trade_volume = min(
                    buy.volume - buy.filled_volume, sell.volume - sell.filled_volume
                )
                if buy.order_type == "MARKET" or sell.order_type == "MARKET":
                    trade_price = sell.price if buy.order_type == "LIMIT" else buy.price
                else:
                    trade_price = (buy.price + sell.price) / 2

                # Trade 생성
                trade = Trade(
                    buy_order_id=buy.id,
                    sell_order_id=sell.id,
                    stock_id=stock_id,
                    price=trade_price,
                    volume=trade_volume,
                    trade_time=datetime.now(timezone.utc),
                )
                db.add(trade)

                # 주문 상태 업데이트
                buy.filled_volume += trade_volume
                sell.filled_volume += trade_volume

                buy.status = "FILLED" if buy.filled_volume >= buy.volume else "PARTIAL"
                sell.status = "FILLED" if sell.filled_volume >= sell.volume else "PARTIAL"

                # === 핵심: 사용자 자산 업데이트 ===
                try:
                    self._process_trade(db, trade, buy, sell)
                    db.commit()
                except Exception as e:
                    db.rollback()
                    print(f"Trade Processing Error: {e}")
                    break

                match_count += 1

                # WebSocket 브로드캐스트 (다른 파일에서 manager.broadcast 호출 가능)
                # 여기서는 간단히 print로 대체하거나 별도 이벤트로 처리

            if match_count > 0:
                print(
                    f"[MatchingEngine] {match_count}건 체결 완료 - Stock ID: {stock_id}"
                )

    def _cancel_expired_orders(self, db: Session, stock_id: int):
        """사용자 주문은 90초, 봇 주문은 30초로 차등 적용"""
        now = datetime.now(timezone.utc)

        # 사용자 주문: 90초 타임아웃
        user_expired = (
            db.query(Order)
            .filter(
                Order.stock_id == stock_id,
                Order.status.in_(["PENDING", "PARTIAL"]),
                Order.user_id.notin_(BOT_USER_IDS),  # 실제 사용자
                Order.created_at < now - timedelta(seconds=90),
            )
            .all()
        )

        # 봇 주문: 30초 타임아웃 (기존처럼 빠르게 정리)
        bot_expired = (
            db.query(Order)
            .filter(
                Order.stock_id == stock_id,
                Order.status.in_(["PENDING", "PARTIAL"]),
                Order.user_id.in_(BOT_USER_IDS),
                Order.created_at < now - timedelta(seconds=30),
            )
            .all()
        )

        for order in user_expired + bot_expired:
            old_status = order.status
            order.status = "CANCELLED"
            print(
                f"⏰ 타임아웃 취소 → User{order.user_id} | {order.side} {order.volume}주 "
                f"@ {order.price} (ID:{order.id}, {old_status}→CANCELLED)"
            )

        if user_expired or bot_expired:
            db.commit()

    def _get_active_orders(self, db: Session, stock_id: int, side: str):
        query = db.query(Order).filter(
            Order.stock_id == stock_id,
            Order.side == side,
            Order.status.in_(["PENDING", "PARTIAL"]),
        )

        if side == "BUY":
            query = query.order_by(
                Order.order_type.desc(),
                Order.price.desc().nullslast(),
                Order.created_at.asc(),
            )
        else:
            query = query.order_by(
                Order.order_type.desc(),
                Order.price.asc().nullslast(),
                Order.created_at.asc(),
            )

        return query.first()

    def _process_trade(
        self, db: Session, trade: Trade, buy_order: Order, sell_order: Order
    ):
        trade_amount = trade.price * trade.volume

        # ==================== 매수자 처리 ====================
        if buy_order.user_id not in BOT_USER_IDS:
            self._update_holding(
                db,
                buy_order.user_id,
                trade.stock_id,
                trade.volume,
                trade.price,
                is_buy=True,
            )
            self._update_cash(db, buy_order.user_id, -trade_amount)
            db.flush()  # ← 매우 중요!
            self._recalculate_total_balance(db, buy_order.user_id)

        # ==================== 매도자 처리 ====================
        if sell_order.user_id not in BOT_USER_IDS:
            self._update_holding(
                db,
                sell_order.user_id,
                trade.stock_id,
                trade.volume,
                trade.price,
                is_buy=False,
            )
            self._update_cash(db, sell_order.user_id, +trade_amount)
            db.flush()  # ← 매우 중요!
            self._recalculate_total_balance(db, sell_order.user_id)

        # 3. 시장 가격 업데이트
        self._update_market_price(db, trade.stock_id, trade.price, trade.volume)

        # 4. 거래 로그
        self._log_transactions(db, trade, buy_order, sell_order, trade_amount)

    def _recalculate_total_balance(self, db: Session, user_id: int):
        balance = db.query(UserBalance).filter_by(user_id=user_id).first()
        if not balance:
            return

        holdings_value = db.query(func.sum(UserHolding.current_value)).filter(
            UserHolding.user_id == user_id
        ).scalar() or Decimal("0")

        balance.total_balance = balance.cash_balance + holdings_value

    def _update_holding(
        self,
        db: Session,
        user_id: int,
        stock_id: int,
        volume: int,
        price: Decimal,
        is_buy: bool,
    ):
        """보유 종목 업데이트"""
        try:
            print(
                f"[HOLDING START] User={user_id} Stock={stock_id} is_buy={is_buy} vol={volume} price={price}"
            )

            holding = (
                db.query(UserHolding)
                .filter_by(user_id=user_id, stock_id=stock_id)
                .first()
            )

            if not holding:
                holding = UserHolding(
                    user_id=user_id,
                    stock_id=stock_id,
                    quantity=0,
                    avg_price=price,  # NOT NULL
                    total_invested=Decimal("0"),
                    current_price=price,
                    current_value=Decimal("0"),  # 명시적으로 넣기
                    pnl=Decimal("0"),
                    pnl_rate=Decimal("0"),
                    # updated_at은 DB default나 trigger가 처리
                )
                db.add(holding)
                db.flush()  # INSERT 강제 + ID 확인용
                print(f"[HOLDING] 새 보유종목 생성 성공 → ID={holding.id}")

            # ====================== 매수 / 매도 처리 ======================
            if is_buy:
                new_total_cost = holding.total_invested + (price * volume)
                holding.quantity += volume
                if holding.quantity > 0:
                    holding.avg_price = new_total_cost / Decimal(
                        holding.quantity
                    )
                else:
                    holding.avg_price = price
                holding.total_invested = new_total_cost
            else:
                if holding.quantity < volume:
                    raise ValueError(f"보유 수량 부족: {holding.quantity} < {volume}")

                sell_ratio = Decimal(volume) / Decimal(holding.quantity)
                sell_invested = holding.total_invested * sell_ratio

                holding.quantity -= volume
                holding.total_invested -= sell_invested

                if holding.quantity == 0:
                    db.delete(holding)
                    print(f"[HOLDING] 전량 매도 → 삭제")
                    return

            # ====================== 실시간 평가치 업데이트 ======================
            stock = db.query(Stock).get(stock_id)
            current_price = (
                stock.last_price if stock and stock.last_price is not None else price
            )

            holding.current_price = current_price
            holding.current_value = Decimal(holding.quantity) * current_price
            holding.pnl = holding.current_value - holding.total_invested
            holding.pnl_rate = (
                (holding.pnl / holding.total_invested * Decimal("100"))
                if holding.total_invested > 0
                else Decimal("0")
            )

            print(
                f"[HOLDING END] User={user_id} qty={holding.quantity} "
                f"avg={holding.avg_price} value={holding.current_value} pnl={holding.pnl}"
            )

        except Exception as e:
            print(
                f"[HOLDING ERROR] User={user_id} Stock={stock_id} → {type(e).__name__}: {e}"
            )
            import traceback

            traceback.print_exc()
            raise  # 반드시 다시 raise 해야 rollback이 제대로 됨

    def _update_cash(self, db: Session, user_id: int, amount: Decimal):
        balance = db.query(UserBalance).filter_by(user_id=user_id).first()

        if not balance:
            balance = UserBalance(
                user_id=user_id,
                total_balance=Decimal("10000000"),
                cash_balance=Decimal("10000000"),
            )
            db.add(balance)

        balance.cash_balance += amount

        # total_balance는 cash + holdings.current_value 합계로 다시 계산하는 것이 정확
        # (아래 recalculate_total_balance 호출 추천)

    def _update_market_price(
        self, db: Session, stock_id: int, price: Decimal, volume: int
    ):
        """시장 가격 및 Quote 업데이트"""
        stock = db.query(Stock).get(stock_id)
        if not stock:
            return

        stock.last_price = price
        stock.volume = (stock.volume or 0) + volume

        if not stock.prev_close:
            stock.prev_close = price

        stock.change_rate = (
            ((price - stock.prev_close) / stock.prev_close * 100)
            if stock.prev_close
            else Decimal("0")
        )

        # Quote 기록
        latest_quote = (
            db.query(Quote)
            .filter(Quote.stock_id == stock_id)
            .order_by(Quote.quote_time.desc())
            .first()
        )

        now = datetime.now(timezone.utc)
        if latest_quote and (now - latest_quote.quote_time).total_seconds() < 3:
            # 같은 초에 합치기
            latest_quote.close_price = price
            latest_quote.high_price = max(latest_quote.high_price, price)
            latest_quote.low_price = min(latest_quote.low_price, price)
            latest_quote.volume += volume
        else:
            new_quote = Quote(
                stock_id=stock_id,
                open_price=price,
                high_price=price,
                low_price=price,
                close_price=price,
                volume=volume,
                quote_time=now,
                date_only=now.date(),
            )
            db.add(new_quote)

    def _log_transactions(
        self,
        db: Session,
        trade: Trade,
        buy_order: Order,
        sell_order: Order,
        amount: Decimal,
    ):
        """거래 로그 기록"""
        # 매수자 로그
        db.add(
            Transaction(
                user_id=buy_order.user_id,
                stock_id=trade.stock_id,
                type="BUY",
                amount=-amount,
                quantity=trade.volume,
                price=trade.price,
                description=f"{trade.volume}주 매수 @ {trade.price}",
            )
        )

        # 매도자 로그
        db.add(
            Transaction(
                user_id=sell_order.user_id,
                stock_id=trade.stock_id,
                type="SELL",
                amount=amount,
                quantity=trade.volume,
                price=trade.price,
                description=f"{trade.volume}주 매도 @ {trade.price}",
            )
        )


_engine_instance: Optional["MatchingEngine"] = None


def get_matching_engine() -> "MatchingEngine":
    """앱 전체에서 단일 MatchingEngine 인스턴스(단일 Lock) 공유"""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = MatchingEngine()
    return _engine_instance
