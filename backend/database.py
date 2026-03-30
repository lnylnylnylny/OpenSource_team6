import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import URL

# 1. .env 파일 로드 (Local 환경용)
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)

# 2. 필수 환경 변수 목록 정의 및 검증
required_env_vars = ["DB_USER", "DB_PASSWORD", "DB_HOST", "DB_NAME"]
missing_vars = [var for var in required_env_vars if not os.getenv(var)]

if missing_vars:
    # 어떤 변수가 빠졌는지 명확하게 에러 발생시키기
    raise ImportError(
        f"❌ 필수 환경 변수가 누락되었습니다: {', '.join(missing_vars)}. "
        ".env 파일이나 시스템 환경 변수를 확인해주세요."
    )

# 3. 환경 변수 가져오기
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
host = os.getenv("DB_HOST")
db_name = os.getenv("DB_NAME")
port = os.getenv("DB_PORT") # 포트는 필수가 아니므로 기본값 처리

# 4. 안전하게 DB URL 생성
db_url = URL.create(
    "mysql+pymysql",
    username=user,
    password=password,
    host=host,
    port=int(port) if port else 28282, # 포트 기본값 설정
    database=db_name,
)

engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()