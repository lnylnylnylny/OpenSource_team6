from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
import schemas
from typing import List
from typing import List, Optional

router = APIRouter(
    prefix="/api/quizzes",
    tags=["quizzes"]
)

@router.get("/random", response_model=schemas.QuizResponse)
def get_random_quiz(difficulty: Optional[str] = None, db: Session = Depends(get_db)):
    """
    데이터베이스에서 퀴즈 1개를 랜덤으로 가져옵니다.
    쿼리 파라미터로 difficulty(상, 중, 하)를 전달하면 해당 난이도 내에서 랜덤으로 뽑습니다.
    예: /api/quizzes/random?difficulty=하
    """
    query = db.query(models.Quiz)
    
    # 난이도가 파라미터로 들어온 경우 필터링 추가
    if difficulty:
        query = query.filter(models.Quiz.difficulty == difficulty)
    
    quiz = query.order_by(func.random()).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="해당 조건의 퀴즈를 찾을 수 없습니다.")
        
    return quiz

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