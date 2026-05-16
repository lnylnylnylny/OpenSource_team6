from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from database import get_db
from core.jwt import get_current_user
from model import User, UserBalance, Transaction
import model
import schemas
from typing import List, Optional

router = APIRouter(
    prefix="/api/quizzes",
    tags=["quizzes"]
)

QUIZ_REWARDS = {"하": 1000, "중": 3000, "상": 500000}


class QuizSubmitRequest(BaseModel):
    quiz_id: int
    selected_answer: int

@router.get("/random", response_model=schemas.QuizResponse)
def get_random_quiz(difficulty: Optional[str] = None, db: Session = Depends(get_db)):
    """
    데이터베이스에서 퀴즈 1개를 랜덤으로 가져옵니다.
    쿼리 파라미터로 difficulty(상, 중, 하)를 전달하면 해당 난이도 내에서 랜덤으로 뽑습니다.
    예: /api/quizzes/random?difficulty=하
    """
    query = db.query(model.Quiz)
    
    # 난이도가 파라미터로 들어온 경우 필터링 추가
    if difficulty:
        query = query.filter(model.Quiz.difficulty == difficulty)
    
    quiz = query.order_by(func.random()).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="해당 조건의 퀴즈를 찾을 수 없습니다.")
        
    return quiz

@router.get("/", response_model=List[schemas.QuizResponse])
def get_all_quizzes(db: Session = Depends(get_db)):
    """
    데이터베이스에서 모든 퀴즈 목록을 가져옵니다.
    """
    return db.query(model.Quiz).all()

@router.get("/difficulty/{level}", response_model=List[schemas.QuizResponse])
def get_quizzes_by_difficulty(level: str, db: Session = Depends(get_db)):
    """
    난이도(상, 중, 하)에 따른 퀴즈 목록을 필터링합니다.
    """
    return db.query(model.Quiz).filter(model.Quiz.difficulty == level).all()


@router.post("/submit")
def submit_quiz(
    req: QuizSubmitRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    quiz = db.query(model.Quiz).filter(model.Quiz.id == req.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="퀴즈를 찾을 수 없습니다.")

    is_correct = req.selected_answer == quiz.answer
    reward = 0

    if is_correct:
        reward = QUIZ_REWARDS.get(quiz.difficulty, 0)

        balance = db.query(UserBalance).filter(UserBalance.user_id == user.id).first()
        if not balance:
            balance = UserBalance(
                user_id=user.id,
                total_balance=user.initial_balance + reward,
                cash_balance=user.initial_balance + reward,
            )
            db.add(balance)
        else:
            balance.cash_balance += reward
            balance.total_balance += reward

        transaction = Transaction(
            user_id=user.id,
            type="DEPOSIT",
            amount=reward,
            description=f"퀴즈 보상 (난이도: {quiz.difficulty})",
        )
        db.add(transaction)
        db.commit()

    return {"is_correct": is_correct, "reward": reward}