# routers/balance.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel
from decimal import Decimal
from typing import List, Literal
from datetime import datetime
from datetime import timezone

from database import get_db
from core.jwt import get_current_user
from model import User, UserBalance, UserHolding, Transaction, Stock

router = APIRouter(prefix="/balance", tags=["balance"])


# ====================== Response Models ======================
class BalanceResponse(BaseModel):
    total_balance: Decimal
    cash_balance: Decimal
    total_pnl: Decimal = Decimal("0")
    total_pnl_rate: Decimal = Decimal("0")
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class HoldingResponse(BaseModel):
    stock_symbol: str  # stock_code → stock_symbol
    stock_name: str
    quantity: int
    avg_price: Decimal
    current_price: Decimal | None
    current_value: Decimal | None
    pnl: Decimal
    pnl_rate: Decimal

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    id: int
    type: str
    amount: Decimal
    quantity: int | None = None
    price: Decimal | None = None
    description: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


# ====================== API ======================
@router.get("/me", response_model=BalanceResponse)
def get_my_balance(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    balance = db.query(UserBalance).filter_by(user_id=user.id).first()

    if not balance:
        # 최초 접속 시 자동 생성
        balance = UserBalance(
            user_id=user.id,
            total_balance=user.initial_balance or Decimal("10000000"),
            cash_balance=user.initial_balance or Decimal("10000000"),
        )
        db.add(balance)
        db.commit()
        db.refresh(balance)

    total_holdings_value = (
        db.query(func.coalesce(func.sum(UserHolding.current_value), 0))
        .filter(UserHolding.user_id == user.id, UserHolding.quantity > 0)
        .scalar()
    )
    total_holdings_invested = (
        db.query(func.coalesce(func.sum(UserHolding.total_invested), 0))
        .filter(UserHolding.user_id == user.id, UserHolding.quantity > 0)
        .scalar()
    )

    # 응답 시점 기준으로 요약값을 계산해 반환 (DB 저장값과 별도로 최신 상태 보장)
    balance.total_balance = balance.cash_balance + total_holdings_value
    balance.total_pnl = total_holdings_value - total_holdings_invested
    balance.total_pnl_rate = (
        (balance.total_pnl / total_holdings_invested) * Decimal("100")
        if total_holdings_invested > 0
        else Decimal("0")
    )

    return balance


@router.get("/holdings", response_model=List[HoldingResponse])
def get_my_holdings(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    holdings = (
        db.query(UserHolding)
        .filter(UserHolding.user_id == user.id, UserHolding.quantity > 0)
        .all()
    )

    result = []
    for h in holdings:
        stock = h.stock  # relationship 사용
        result.append(
            {
                "stock_symbol": stock.symbol,  # symbol로 변경
                "stock_name": stock.name,
                "quantity": h.quantity,
                "avg_price": h.avg_price,
                "current_price": h.current_price or stock.last_price,
                "current_value": h.current_value,
                "pnl": h.pnl,
                "pnl_rate": h.pnl_rate,
            }
        )
    return result


@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == user.id)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
        .all()
    )


# ====================== 입출금 API ======================
class DepositWithdrawRequest(BaseModel):
    amount: Decimal
    type: Literal["DEPOSIT", "WITHDRAW"]


@router.post("/deposit-withdraw")
def deposit_withdraw(
    req: DepositWithdrawRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if req.amount <= 0:
        raise HTTPException(400, "금액은 0보다 커야 합니다")

    balance = db.query(UserBalance).filter_by(user_id=user.id).first()
    if not balance:
        raise HTTPException(404, "잔고 정보를 찾을 수 없습니다")

    if req.type == "WITHDRAW" and balance.cash_balance < req.amount:
        raise HTTPException(400, "출금 가능한 잔고가 부족합니다")

    if req.type == "DEPOSIT":
        balance.cash_balance += req.amount
        balance.total_balance += req.amount
    else:  # WITHDRAW
        balance.cash_balance -= req.amount
        balance.total_balance -= req.amount

    transaction = Transaction(
        user_id=user.id,
        type=req.type,
        amount=req.amount,
        description=f"{req.type} {req.amount:,.0f}원",
        created_at=datetime.now(timezone.utc),
    )
    db.add(transaction)
    db.commit()

    return {
        "message": f"{req.type} 완료",
        "new_cash": balance.cash_balance,
        "new_total": balance.total_balance,
    }
