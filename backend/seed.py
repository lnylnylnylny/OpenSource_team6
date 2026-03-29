from database import SessionLocal
from models import Quiz

def insert_data():
    db = SessionLocal()
    
    # 태하가 준비한 주식 퀴즈 데이터 여기다 넣는거
    stock_quizzes = [
        Quiz(
            question="삼성전자의 종목 코드는 무엇인가요?", 
            options="005930,000660,035720,035420", 
            answer=0, 
            explanation="삼성전자의 종목 코드는 005930입니다."
        ),
        Quiz(
            question="주식 시장에서 '매수'의 반대말은?", 
            options="공매도,매도,상장,증자", 
            answer=1, 
            explanation="사는 것을 매수, 파는 것을 매도라고 합니다."
        )
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
    insert_data()