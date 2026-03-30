from sqlalchemy import Column, Integer, String, Text
from database import Base, engine

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)      # 문제 내용
    options = Column(Text, nullable=False)       # 보기 (콤마로 구분해서 저장)
    answer = Column(Integer, nullable=False)     # 정답 번호 (0, 1, 2...)
    explanation = Column(Text)                   # 해설 -> 추후 없애도 괜찮

# 이 코드가 실행될 때 DB에 실제 테이블이 생성!
Base.metadata.create_all(bind=engine)