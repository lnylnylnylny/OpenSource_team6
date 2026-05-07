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

    # 태하가 준비한 주식 퀴즈 데이터 여기다 넣는거
    stock_quizzes = [
        Quiz(
            question="삼성전자의 종목 코드는 무엇인가요?",
            options="005930,000660,035720,035420",
            answer=0,
            explanation="삼성전자의 종목 코드는 005930입니다.",
        ),
        Quiz(
            question="주식 시장에서 '매수'의 반대말은?",
            options="공매도,매도,상장,증자",
            answer=1,
            explanation="사는 것을 매수, 파는 것을 매도라고 합니다.",
        ),
    ]

    try:
        db.add_all(stock_quizzes)
        db.commit()
        print("✅ 데이터 입력 완료!")
    except Exception as e:
        print(f"❌ 에러 발생: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_dummy_users()
    insert_data()
