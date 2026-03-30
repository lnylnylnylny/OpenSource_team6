import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import URL

# .env 파일의 내용 읽어오기!
load_dotenv()

# 환경변수에서 정보 가져오기!
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
host = os.getenv("DB_HOST")
port = os.getenv("DB_PORT")
db_name = os.getenv("DB_NAME")

db_url = URL.create(
    "mysql+pymysql",
    username=user,
    password=password,
    host=host,
    port=int(port) if port else 3306,
    database=db_name,
)

engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()