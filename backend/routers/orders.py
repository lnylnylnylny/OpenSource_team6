# routers/orders.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Literal, List
from decimal import Decimal
from datetime import datetime, timezone

from database import get_db
from model import Order, Stock, User, UserHolding, UserBalance
from core.trade_system import get_matching_engine
from websocket_manager import manager
from core.jwt import get_current_user
from core.trade_bot import TradeBot, get_trade_bot

router = APIRouter(prefix="/orders", tags=["orders"])

matching_engine = get_matching_engine()


class OrderCreate(BaseModel):
    stock_code: str
    side: Literal["BUY", "SELL"]
    order_type: Literal["LIMIT", "MARKET"]
    price: Decimal | None = None
    volume: int


class OrderResponse(BaseModel):
    id: int
    stock_code: str
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
    trade_bot: TradeBot = Depends(get_trade_bot),
):
    stock = db.query(Stock).filter(Stock.code == order.stock_code).first()
    if not stock:
        raise HTTPException(404, "종목을 찾을 수 없습니다")

    if order.order_type == "LIMIT" and not order.price:
        raise HTTPException(400, "지정가는 가격이 필수입니다")

    # ==================== 즉시 체결 처리 ====================
    executed_price = order.price

    if order.order_type == "MARKET":
        executed_price = getattr(stock, "last_price", None) or getattr(
            stock, "current_price", None
        )
        if not executed_price:
            raise HTTPException(400, "현재가를 가져올 수 없습니다")

    # BUY / SELL 검증
    if order.side == "BUY" and user.provider != "dummy":
        required_amount = executed_price * order.volume

        balance = db.query(UserBalance).filter_by(user_id=user.id).first()
        if not balance or balance.cash_balance < required_amount:
            raise HTTPException(
                status_code=400,
                detail=f"보유 현금이 부족합니다. 필요: {required_amount:,}원, 보유: {balance.cash_balance if balance else 0:,.0f}원",
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

    # ==================== 주문 생성 및 즉시 체결 ====================
    new_order = Order(
        user_id=user.id,
        stock_id=stock.id,
        side=order.side,
        order_type=order.order_type,
        price=executed_price,  # MARKET인 경우 실제 체결 가격 저장
        volume=order.volume,
        filled_volume=0,
        status="PENDING",
        created_at=datetime.now(timezone.utc),
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # ==================== 봇 반대 주문 (필요 시) ====================
    # 사용자 주문은 이미 체결되었으므로, 봇에게만 반대 주문을 넣어 시장 유동성 유지
    await trade_bot.create_instant_counter_order(db, new_order.stock_id, new_order)

    # WebSocket 브로드캐스트
    await manager.broadcast(
        stock.code,
        {
            "type": "order_filled",
            "symbol": stock.code,
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
        "stock_code": stock.code,
        "side": new_order.side,
        "order_type": new_order.order_type,
        "price": new_order.price,
        "volume": new_order.volume,
        "filled_volume": new_order.filled_volume,
        "status": new_order.status,
        "created_at": new_order.created_at,
    }


# 나머지 엔드포인트는 그대로 유지
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
            "stock_code": o.stock.code,
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
