from sqlalchemy import Column, BigInteger, String, DateTime, func
from database import Base


class User(Base):
    __tablename__ = "users"

    id             = Column(BigInteger, primary_key=True, autoincrement=True)
    provider       = Column(String(20), nullable=False)           # "kakao"
    provider_id    = Column(String(100), nullable=False)          # 카카오 고유 ID
    email          = Column(String(255), nullable=True)
    nickname       = Column(String(50), nullable=True)
    profile_image  = Column(String(500), nullable=True)
    created_at     = Column(DateTime, server_default=func.now())

    __table_args__ = (
        # provider + provider_id 조합 유니크
        {"mysql_charset": "utf8mb4"},
    )