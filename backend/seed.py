import json
import os
from database import SessionLocal
from models import Quiz

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
    insert_data()