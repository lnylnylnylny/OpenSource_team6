from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from typing import List

router = APIRouter(
    prefix="/api/quizzes",
    tags=["quizzes"]
)

@router.get("/", response_model=List[schemas.QuizResponse])
def get_all_quizzes(db: Session = Depends(get_db)):
    """
    데이터베이스에서 모든 퀴즈 목록을 가져옵니다.
    """
    return db.query(models.Quiz).all()

@router.get("/difficulty/{level}", response_model=List[schemas.QuizResponse])
def get_quizzes_by_difficulty(level: str, db: Session = Depends(get_db)):
    """
    난이도(상, 중, 하)에 따른 퀴즈 목록을 필터링합니다.
    """
    return db.query(models.Quiz).filter(models.Quiz.difficulty == level).all()