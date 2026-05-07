# routers/orders.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Literal, List
from decimal import Decimal
from datetime import datetime

from database import get_db
from model import Order, Stock, User, UserHolding, UserBalance
from core.trade_system import MatchingEngine
from websocket_manager import manager
from core.jwt import get_current_user
from core.trade_bot import TradeBot, get_trade_bot

router = APIRouter(prefix="/orders", tags=["orders"])

matching_engine = MatchingEngine()


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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    trade_bot: TradeBot = Depends(get_trade_bot),
):
    stock = db.query(Stock).filter(Stock.code == order.stock_code).first()
    if not stock:
        raise HTTPException(404, "종목을 찾을 수 없습니다")

    if order.order_type == "LIMIT" and not order.price:
        raise HTTPException(400, "지정가는 가격이 필수입니다")

    if order.side == "BUY":
        required_amount = (order.price or 0) * order.volume  # MARKET이면 나중에 처리

        if order.order_type == "MARKET":
            # MARKET 주문은 현재가로 계산 (간단히 stock.current_price 사용 예시)
            current_price = getattr(stock, "current_price", None)
            if not current_price:
                raise HTTPException(400, "현재가를 가져올 수 없습니다")
            required_amount = current_price * order.volume

        balance = db.query(UserBalance).filter_by(user_id=user.id).first()

        if not balance:
            raise HTTPException(
                status_code=400,
                detail=f"보유 현금이 부족합니다. 필요: {required_amount:,}원, 보유: 0원",
            )
        if balance.cash_balance < required_amount:
            raise HTTPException(
                status_code=400,
                detail=f"보유 현금이 부족합니다. 필요: {required_amount:,}원, 보유: {balance.cash_balance:,.0f}원",
            )
    elif order.side == "SELL":
        # 보유 수량 확인
        portfolio = (
            db.query(UserHolding)
            .filter(UserHolding.user_id == user.id, UserHolding.stock_id == stock.id)
            .first()
        )

        owned = portfolio.quantity if portfolio else 0

        if owned < order.volume:
            raise HTTPException(
                status_code=400,
                detail=f"보유 수량이 부족합니다. 주문: {order.volume}주, 보유: {owned}주",
            )

    new_order = Order(
        user_id=user.id,
        stock_id=stock.id,
        side=order.side,
        order_type=order.order_type,
        price=order.price,
        volume=order.volume,
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # 매칭 엔진 실행
    background_tasks.add_task(matching_engine.match_orders, db, new_order.stock_id)

    await trade_bot.create_instant_counter_order(db, new_order.stock_id, new_order)

    # WebSocket 브로드캐스트
    await manager.broadcast(
        stock.code,
        {
            "type": "new_order",
            "symbol": stock.code,
            "side": new_order.side,
            "price": float(new_order.price) if new_order.price else None,
            "volume": new_order.volume,
            "timestamp": datetime.now().isoformat(),
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


@router.get("/me", response_model=List[OrderResponse])
def get_my_orders(
    status: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Order).filter(Order.user_id == user.id)

    if status:
        query = query.filter(Order.status == status)

    # stock_code를 포함하기 위해 join
    orders = (
        query.join(Stock, Order.stock_id == Stock.id)
        .order_by(Order.created_at.desc())
        .all()
    )

    response_data = []
    for order in orders:
        data = {
            "id": order.id,
            "stock_code": order.stock.code,
            "side": order.side,
            "order_type": order.order_type,
            "price": order.price,
            "volume": order.volume,
            "filled_volume": order.filled_volume,
            "status": order.status,
            "created_at": order.created_at,
        }
        response_data.append(data)

    return response_data


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
