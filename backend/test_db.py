from database import engine

try:
    with engine.connect() as connection:
        print("✅ 서버 연결 성공! 주소: hee.now:28282")
except Exception as e:
    print(f"❌ 연결 실패: {e}")