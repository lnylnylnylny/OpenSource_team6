# 잔고 관련 테이블
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, BigInteger, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# 잔고 테이블
class UserBalance(Base):
    __tablename__ = "user_balances"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    total_balance = Column(Numeric(15, 2), nullable=False)      # 총 평가금액 (현금 + 보유주식)
    cash_balance = Column(Numeric(15, 2), nullable=False)       # 사용 가능한 현금
    total_pnl = Column(Numeric(15, 2), default=0)               # 총 손익
    total_pnl_rate = Column(Numeric(8, 4), default=0)           # 총 손익률(%)

    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="balances")

    __table_args__ = (
        UniqueConstraint("user_id", name="uk_user_balance"),
    )


# 보유 종목 테이블
class UserHolding(Base):
    __tablename__ = "user_holdings"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False, index=True)

    quantity = Column(BigInteger, default=0)                    # 보유 수량
    avg_price = Column(Numeric(12, 4), nullable=False)         # 평균 매수단가
    total_invested = Column(Numeric(15, 2), default=0)         # 총 투자금액

    # 실시간 평가
    current_price = Column(Numeric(12, 4))
    current_value = Column(Numeric(15, 2))                      # 현재 평가금액
    pnl = Column(Numeric(15, 2), default=0)                     # unrealized PnL
    pnl_rate = Column(Numeric(8, 4), default=0)                 # 손익률(%)

    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="holdings")
    stock = relationship("Stock")

    __table_args__ = (
        UniqueConstraint("user_id", "stock_id", name="uk_user_stock"),
    )


# 거래 내역 테이블 (입출금 + 매매)
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=True)
    
    type = Column(Enum("DEPOSIT", "WITHDRAW", "BUY", "SELL", name="transaction_type"), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)          # 현금 변동액
    quantity = Column(BigInteger, nullable=True)             # 주식 수량 (매매 시)
    price = Column(Numeric(12, 4), nullable=True)
    
    description = Column(String(200))
    created_at = Column(DateTime, default=func.now())

    user = relationship("User")
    stock = relationship("Stock")

