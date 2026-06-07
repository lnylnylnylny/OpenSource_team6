# routers/orders.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Literal, List
from decimal import Decimal
from datetime import datetime, timezone

from database import get_db
from model import Order, Stock, User, UserHolding, UserBalance, Transaction
from core.trade_system import get_matching_engine
from websocket_manager import manager
from core.jwt import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])

matching_engine = get_matching_engine()  # 현재는 시장 데이터용


class OrderCreate(BaseModel):
    stock_symbol: str  # stock_code → stock_symbol
    side: Literal["BUY", "SELL"]
    order_type: Literal["LIMIT", "MARKET"]
    price: Decimal | None = None
    volume: int


class OrderResponse(BaseModel):
    id: int
    stock_symbol: str  # stock_code → stock_symbol
    side: str
    order_type: str
    price: Decimal | None
    volume: int
    filled_volume: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=OrderResponse)
async def create_order(
    order: OrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # symbol로 종목 조회
    stock = db.query(Stock).filter(Stock.symbol == order.stock_symbol).first()
    if not stock:
        raise HTTPException(404, "종목을 찾을 수 없습니다")

    if order.order_type == "LIMIT" and not order.price:
        raise HTTPException(400, "지정가는 가격이 필수입니다")

    if order.volume <= 0:
        raise HTTPException(400, "주문 수량은 1 이상이어야 합니다")

    # MARKET 주문인 경우 현재가 사용
    executed_price = order.price
    if order.order_type == "MARKET":
        executed_price = stock.last_price
        if not executed_price:
            raise HTTPException(400, "현재가를 가져올 수 없습니다")

    # ==================== 잔고 / 보유량 검증 ====================
    if order.side == "BUY" and user.provider != "dummy":
        required_amount = executed_price * order.volume
        balance = db.query(UserBalance).filter_by(user_id=user.id).first()

        if not balance or balance.cash_balance < required_amount:
            raise HTTPException(
                status_code=400,
                detail=f"보유 현금이 부족합니다. 필요: {required_amount:,.0f}원, 보유: {balance.cash_balance if balance else 0:,.0f}원",
            )

    elif order.side == "SELL" and user.provider != "dummy":
        portfolio = (
            db.query(UserHolding)
            .filter(
                UserHolding.user_id == user.id,
                UserHolding.stock_id == stock.id,
            )
            .first()
        )
        owned = portfolio.quantity if portfolio else 0

        if owned < order.volume:
            raise HTTPException(
                status_code=400,
                detail=f"보유 수량이 부족합니다. 주문: {order.volume}주, 보유: {owned}주",
            )

    # ==================== 주문 생성 ====================
    new_order = Order(
        user_id=user.id,
        stock_id=stock.id,
        side=order.side,
        order_type=order.order_type,
        price=executed_price,
        volume=order.volume,
        filled_volume=0,
        status="FILLED" if order.order_type == "MARKET" else "PENDING",
        created_at=datetime.now(timezone.utc),
    )

    db.add(new_order)


    if order.order_type == "MARKET":
        trade_amount = executed_price * order.volume  # 거래 금액

        # UserBalance 조회 (없으면 생성)
        balance = db.query(UserBalance).filter_by(user_id=user.id).first()
        if not balance:
            balance = UserBalance(
                user_id=user.id,
                total_balance=0,
                cash_balance=0,
                total_pnl=0,
                total_pnl_rate=0,
            )
            db.add(balance)

        # ==================== BUY 처리 ====================
        if order.side == "BUY":
            # 현금 차감
            balance.cash_balance -= trade_amount

            # 보유 종목 조회 또는 생성
            holding = (
                db.query(UserHolding)
                .filter_by(user_id=user.id, stock_id=stock.id)
                .first()
            )
            if not holding:
                holding = UserHolding(
                    user_id=user.id,
                    stock_id=stock.id,
                    quantity=0,
                    avg_price=0,
                    total_invested=0,
                )
                db.add(holding)

            # 평균 단가 및 총 투자금 계산
            old_total_invested = holding.total_invested
            new_total_invested = old_total_invested + trade_amount
            new_quantity = holding.quantity + order.volume

            if new_quantity > 0:
                holding.avg_price = new_total_invested / new_quantity
            holding.quantity = new_quantity
            holding.total_invested = new_total_invested

            # 실시간 평가 정보 업데이트
            holding.current_price = executed_price
            holding.current_value = holding.quantity * executed_price
            holding.pnl = holding.current_value - holding.total_invested
            holding.pnl_rate = (holding.pnl / holding.total_invested * 100) if holding.total_invested > 0 else 0

        # ==================== SELL 처리 ====================
        elif order.side == "SELL":
            # 현금 증가
            balance.cash_balance += trade_amount

            # 보유 종목 차감
            holding = (
                db.query(UserHolding)
                .filter_by(user_id=user.id, stock_id=stock.id)
                .first()
            )
            if not holding or holding.quantity < order.volume:
                raise HTTPException(400, "보유 수량이 부족합니다.")

            # 매도 금액만큼 total_invested 차감 (비례)
            sell_invested = float(holding.total_invested) * (order.volume / holding.quantity)
            
            holding.quantity -= order.volume
            holding.total_invested -= Decimal(sell_invested)

            if holding.quantity > 0:
                holding.current_value = holding.quantity * executed_price
                holding.pnl = holding.current_value - holding.total_invested
                holding.pnl_rate = (holding.pnl / holding.total_invested * 100) if holding.total_invested > 0 else 0
            else:
                # 전량 매도 시
                holding.current_value = 0
                holding.pnl = 0
                holding.pnl_rate = 0
                holding.total_invested = 0

            holding.current_price = executed_price

        # ==================== UserBalance 총 평가금액 업데이트 ====================
        # 전체 보유종목 평가금액 합산
        total_holdings_value = (
            db.query(func.sum(UserHolding.current_value))
            .filter(UserHolding.user_id == user.id)
            .scalar() or 0
        )

        balance.total_balance = balance.cash_balance + total_holdings_value

        # total_pnl, total_pnl_rate 업데이트 (필요 시 더 정교하게 계산)
        # 여기서는 간단히 total_balance 기준으로 계산 (실제로는 realized + unrealized 합산 추천)

    # ==================== 거래 내역 기록 ====================
    transaction = Transaction(
        user_id=user.id,
        stock_id=stock.id,
        type="BUY" if order.side == "BUY" else "SELL",
        amount=trade_amount if order.side == "BUY" else -trade_amount if order.side == "SELL" else trade_amount,
        quantity=order.volume,
        price=executed_price,
        description=f"{order.side} {order.volume}주 @ {executed_price:,}원",
        created_at=datetime.now(timezone.utc),
    )
    db.add(transaction)


    db.commit()
    db.refresh(new_order)

    # WebSocket 브로드캐스트
    await manager.broadcast(
        stock.symbol,  # symbol 사용
        {
            "type": "order_filled",  # 실제로는 아직 체결되지 않았지만 UI 호환을 위해 유지
            "symbol": stock.symbol,
            "side": new_order.side,
            "price": float(new_order.price),
            "volume": new_order.volume,
            "filled_volume": new_order.filled_volume,
            "status": new_order.status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

    return {
        "id": new_order.id,
        "stock_symbol": stock.symbol,
        "side": new_order.side,
        "order_type": new_order.order_type,
        "price": new_order.price,
        "volume": new_order.volume,
        "filled_volume": new_order.filled_volume,
        "status": new_order.status,
        "created_at": new_order.created_at,
    }


@router.get("/me", response_model=List[OrderResponse])
def get_my_orders(
    status: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Order).filter(Order.user_id == user.id)

    if status:
        query = query.filter(Order.status == status)

    orders = (
        query.join(Stock, Order.stock_id == Stock.id)
        .order_by(Order.created_at.desc())
        .all()
    )

    return [
        {
            "id": o.id,
            "stock_symbol": o.stock.symbol,  # symbol로 변경
            "side": o.side,
            "order_type": o.order_type,
            "price": o.price,
            "volume": o.volume,
            "filled_volume": o.filled_volume,
            "status": o.status,
            "created_at": o.created_at,
        }
        for o in orders
    ]


@router.post("/{order_id}/cancel")
def cancel_order(
    order_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    order = (
        db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    )

    if not order or order.status not in ["PENDING", "PARTIAL"]:
        raise HTTPException(400, "취소할 수 없는 주문입니다")

    order.status = "CANCELLED"
    db.commit()

    return {"message": "주문이 취소되었습니다"}
