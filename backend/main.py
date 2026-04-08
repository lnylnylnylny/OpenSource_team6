from fastapi import FastAPI
from auth.login import router as auth_router
from database import Base, engine
from fastapi.middleware.cors import CORSMiddleware

# 앱 시작 시 테이블 자동 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kakao Auth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.get("/")
def root():
    return {"msg": "hello"}

