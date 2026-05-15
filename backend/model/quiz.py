from sqlalchemy import (
    Column,
    Integer,
    Text,
    String,
)
from database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)  # 문제 내용
    options = Column(Text, nullable=False)  # 보기 (콤마로 구분해서 저장)
    answer = Column(Integer, nullable=False)  # 정답 번호 (0, 1, 2...)
    explanation = Column(Text)  # 해설
    difficulty = Column(String(10), nullable=True)  # 난이도 (상, 중, 하)
