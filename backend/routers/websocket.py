# routers/websocket.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import asyncio
import json
from datetime import datetime

from database import get_db
from websocket_manager import manager
from model import Stock, Quote, Trade

router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("/quotes/{symbol}")
async def websocket_quotes(websocket: WebSocket, symbol: str, db: Session = Depends(get_db)):
    await manager.connect(websocket, symbol)
    try:
        # 최초 접속 시 최신 데이터 전송
        stock = db.query(Stock).filter(Stock.code == symbol).first()
        if stock:
            latest = db.query(Quote)\
                .filter(Quote.stock_id == stock.id)\
                .order_by(Quote.quote_time.desc()).first()

            if latest:
                await websocket.send_json({
                    "type": "snapshot",
                    "symbol": symbol,
                    "price": float(latest.close_price),
                    "change_rate": float(stock.change_rate or 0),
                    "volume": latest.volume,
                    "timestamp": latest.quote_time.isoformat()
                })

        while True:
            # 클라이언트에서 ping/pong 또는 subscribe 메시지 받기
            data = await websocket.receive_json()
            if data.get("action") == "subscribe":
                # 여러 종목 구독 가능하게 확장 가능
                pass

    except WebSocketDisconnect:
        manager.disconnect(websocket, symbol)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        manager.disconnect(websocket, symbol)

