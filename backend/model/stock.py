from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
    BigInteger,
    ForeignKey,
    Date,
    Numeric,
    UniqueConstraint,
    Index,
    Enum,
    func,
)
from sqlalchemy.orm import relationship
from database import Base, engine
from datetime import date


# 1. 종목 정보 테이블
class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)  # PK
    code = Column(String(20), unique=True, nullable=False, index=True)      # 종목코드 (005930, AAPL 등)
    name = Column(String(100), nullable=False)                              # 종목명
    
    market = Column(String(20), nullable=False, index=True)                 # KOSPI, KOSDAQ, NYSE 등 (추가)
    asset_type = Column(String(20), default="STOCK")                        # STOCK, ETF, ETN 등 (추가)
    
    listing_date = Column(Date, nullable=True)                              # 상장일
    is_active = Column(Boolean, default=True, nullable=False)
    description = Column(Text)
    
    # 실시간 가격 캐싱 (자주 조회되므로 매우 중요!)
    last_price = Column(Numeric(12, 4))
    prev_close = Column(Numeric(12, 4))
    change_rate = Column(Numeric(8, 4))
    volume = Column(BigInteger, default=0)
    market_cap = Column(BigInteger, default=0)
    
    updated_at = Column(
        DateTime,
        nullable=False,
        default=func.now(),
        onupdate=func.now()
    )

    # Relationship
    quotes = relationship("Quote", back_populates="stock", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="stock", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Stock {self.code} - {self.name}>"


# 2. 주식 시세 테이블 (실시간/분봉)
class Quote(Base):
    __tablename__ = "stock_quotes"

    quote_id = Column(BigInteger, primary_key=True, autoincrement=True)
    stock_id = Column(
        ForeignKey("stocks.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    quote_time = Column(DateTime, nullable=False, default=func.now(), index=True)
    date_only = Column(Date, nullable=False, index=True, default=date.today)

    # 가격
    open_price = Column(Numeric(12, 4), nullable=False)
    high_price = Column(Numeric(12, 4), nullable=False)
    low_price = Column(Numeric(12, 4), nullable=False)
    close_price = Column(Numeric(12, 4), nullable=False)

    # 거래량
    volume = Column(BigInteger, nullable=False, default=0)
    volume_value = Column(Numeric(20, 2), nullable=False, default=0)

    # 추가 정보
    prev_close = Column(Numeric(12, 4))
    change_price = Column(Numeric(12, 4))
    change_rate = Column(Numeric(8, 4))

    # 호가 정보 (실시간 호가창용)
    bid_price = Column(Numeric(12, 4))
    ask_price = Column(Numeric(12, 4))

    __table_args__ = (
        UniqueConstraint("stock_id", "quote_time", name="uk_stock_time"),
        Index("idx_stock_time", "stock_id", "quote_time"),
        Index("idx_stock_date", "stock_id", "date_only"),
        Index("idx_stock_time_desc", "stock_id", "quote_time", mysql_length=255),  # DESC 인덱스
    )

    # Relationship
    stock = relationship("Stock", back_populates="quotes")

    def __repr__(self):
        return f"<Quote {self.stock.code} @ {self.quote_time}>"


# 3. 주문 테이블 (체결 시스템 핵심)
class Order(Base):
    __tablename__ = "orders"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)  # 사용자 (users 테이블 필요)
    stock_id = Column(ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False, index=True)

    side = Column(Enum("BUY", "SELL", name="order_side"), nullable=False)                    # 매수/매도
    order_type = Column(Enum("LIMIT", "MARKET", name="order_type"), nullable=False)          # 지정가 / 시장가
    
    price = Column(Numeric(12, 4), nullable=True)                         # MARKET이면 NULL
    volume = Column(BigInteger, nullable=False)                           # 주문 수량
    filled_volume = Column(BigInteger, default=0)                         # 체결된 수량
    
    status = Column(
        Enum("PENDING", "PARTIAL", "FILLED", "CANCELLED", name="status"),
        default="PENDING"
    )
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationship
    stock = relationship("Stock", back_populates="orders")
    user = relationship("User", back_populates="orders")

    __table_args__ = (
        Index("idx_user_stock_status", "user_id", "stock_id", "status"),
    )


# 4. 체결 내역 테이블 (추가 추천)
class Trade(Base):
    __tablename__ = "trades"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    buy_order_id = Column(ForeignKey("orders.id"))
    sell_order_id = Column(ForeignKey("orders.id"))
    
    stock_id = Column(ForeignKey("stocks.id"), nullable=False)
    price = Column(Numeric(12, 4), nullable=False)
    volume = Column(BigInteger, nullable=False)
    
    trade_time = Column(DateTime, default=func.now())

    # Relationship
    stock = relationship("Stock")


# 이 코드가 실행될 때 DB에 실제 테이블이 생성!
Base.metadata.create_all(bind=engine)
