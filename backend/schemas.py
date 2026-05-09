from pydantic import BaseModel
from typing import Optional

class QuizResponse(BaseModel):
    id: int
    question: str
    options: str
    answer: int
    explanation: Optional[str]
    difficulty: str

    class Config:
        from_attributes = True # SQLAlchemy 모델을 Pydantic으로 변환 허용