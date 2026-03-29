from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 태하's 설정: localhost(내컴퓨터), 3306(포트), quiz_db(데이터베이스)
DB_URL = "mysql+pymysql://root:123123@localhost:3306/quiz_db"

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()