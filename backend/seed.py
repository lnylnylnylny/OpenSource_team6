import json
import os
from database import SessionLocal
from model import Quiz
from decimal import Decimal
from model import User, UserBalance, UserHolding, Stock


# dummy_users
DUMMY_USERS = [
    {"id": 9991, "username": "dummy_liquidity1", "email": "dummy1@test.com"},
    {"id": 9992, "username": "dummy_liquidity2", "email": "dummy2@test.com"},
    {"id": 9993, "username": "dummy_liquidity3", "email": "dummy3@test.com"},
]


def create_dummy_users():
    db = SessionLocal()
    for du in DUMMY_USERS:
        user = db.query(User).filter_by(id=du["id"]).first()
        if not user:
            user = User(
                id=du["id"],
                provider_id=0,
                nickname=du["username"],
                email=du["email"],
                provider="dummy",
            )
            db.add(user)
            db.flush()

        # 잔고 1억 원
        balance = db.query(UserBalance).filter_by(user_id=user.id).first()
        if not balance:
            balance = UserBalance(
                user_id=user.id,
                cash_balance=Decimal("100000000"),
                total_balance=Decimal("100000000"),
            )
            db.add(balance)

        # 모든 종목 10,000주씩 미리 보유
        stocks = db.query(Stock).all()
        for stock in stocks:
            holding = (
                db.query(UserHolding)
                .filter_by(user_id=user.id, stock_id=stock.id)
                .first()
            )
            if not holding:
                holding = UserHolding(
                    user_id=user.id,
                    stock_id=stock.id,
                    quantity=10000,
                    avg_price=Decimal("10000"),
                    total_invested=Decimal("100000000"),
                    current_price=stock.last_price or Decimal("10000"),
                    current_value=Decimal("100000000"),
                )
                db.add(holding)

    db.commit()
    print("✅ 더미 유저 생성 완료 (ID: 9991~9993)")


def insert_data():
    db = SessionLocal()
    
    # 1. 재료(JSON) 파일 경로 찾기
    json_path = os.path.join(os.path.dirname(__file__), "data", "quizzes.json")
    
    try:
        # 2. 재료 파일 열기
        with open(json_path, "r", encoding="utf-8") as f:
            quiz_list = json.load(f)
        
        # 3. DB에 넣을 준비
        stock_quizzes = [
            Quiz(
                question=q["question"],
                options=q["options"],
                answer=q["answer"],
                explanation=q.get("explanation", ""),
                difficulty=q["difficulty"]
            ) for q in quiz_list
        ]

        db.add_all(stock_quizzes)
        db.commit()
        print(f"✅ 총 {len(stock_quizzes)}개의 퀴즈 입력 완료!")
        
    except FileNotFoundError:
        print("❌ 에러: backend/data/quizzes.json 파일을 찾을 수 없습니다.")
    except Exception as e:
        print(f"❌ 에러 발생: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    # create_dummy_users()
    insert_data()
