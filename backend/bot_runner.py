# trade_bot_runner.py
import asyncio
from sqlalchemy.orm import Session
from core.trade_bot import get_trade_bot

class TradeBotManager:
    def __init__(self):
        self.bot = get_trade_bot()
        self.task: asyncio.Task | None = None
        self.is_running = False

    async def start(self, db: Session):
        if self.is_running:
            return
        self.is_running = True
        self.task = asyncio.create_task(self._run_bot(db))
        print("🚀 Trade Bot Background Task 시작")

    async def stop(self):
        if not self.is_running:
            return
        self.is_running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
            print("⛔ Trade Bot Background Task 종료")
            self.task = None

    async def _run_bot(self, db: Session):
        try:
            await self.bot.start(db)
        except asyncio.CancelledError:
            await self.bot.stop()
            print("✅ Bot이 취소되어 안전하게 종료됨")
        except Exception as e:
            print(f"❌ Trade Bot 크래시: {e}")
        finally:
            db.close()


trade_bot_manager = TradeBotManager()