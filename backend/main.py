from fastapi import FastAPI
from auth.login import router as auth_router
from database import Base, engine, SessionLocal
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers.users import router as users_router
from routers.stocks import router as stocks_router
from routers.balance import router as balance_router
from routers.websocket import router as websocket_router
from routers.orders import router as orders_router
from routers.quotes import router as quotes_router
from contextlib import asynccontextmanager
from routers.quiz import router as quiz_router

# 앱 시작 시 테이블 자동 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Stock App")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(stocks_router)
app.include_router(balance_router)
app.include_router(websocket_router)
app.include_router(orders_router)
app.include_router(quotes_router)

app.include_router(quiz_router)

@app.get("/")
def root():
    return {"msg": "hello"}
