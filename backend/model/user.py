from sqlalchemy import Column, BigInteger, String, DateTime, func, Numeric
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id             = Column(BigInteger, primary_key=True, autoincrement=True)
    provider       = Column(String(20), nullable=False)           # "kakao"
    provider_id    = Column(String(100), nullable=False)          # 카카오 고유 ID
    email          = Column(String(255), nullable=True)
    nickname       = Column(String(50), nullable=True)
    profile_image  = Column(String(500), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    initial_balance = Column(Numeric(15, 2), default=1000000, nullable=False) # 초기 자본금 (100만원)
    balances = relationship("UserBalance", back_populates="user", cascade="all, delete-orphan")
    holdings = relationship("UserHolding", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        # provider + provider_id 조합 유니크
        {"mysql_charset": "utf8mb4"},
    )