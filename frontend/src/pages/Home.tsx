import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../store/authStore";

import {
  RecentTransactions,
  type Transaction,
} from "../components/RecentTransactions";
import api from "../api";
import { formatWon } from "@/api/numbers";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return { message: "조용한 새벽이에요", emoji: "🌙" };
  if (hour < 12) return { message: "좋은 아침이에요", emoji: "☀️" };
  if (hour < 18) return { message: "맛있는 점심이에요", emoji: "🌤️" };
  if (hour < 22) return { message: "좋은 저녁이에요", emoji: "🌆" };
  return { message: "편안한 밤이에요", emoji: "🌙" };
};

export const Home = () => {
  const { message: greetingMessage, emoji: greetingEmoji } = getGreeting();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [todayEarned, setTodayEarned] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );

  useEffect(() => {
    api
      .get("/balance/me")
      .then((res) => {
        setCashBalance(Number(res.data.cash_balance));
      })
      .catch(() => {});

    api
      .get("/balance/transactions")
      .then((res) => {
        const today = new Date().toDateString();
        const earned = res.data
          .filter(
            (t: Transaction) =>
              t.type === "DEPOSIT" &&
              t.description?.includes("퀴즈 보상") &&
              new Date(t.created_at).toDateString() === today
          )
          .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
        setTodayEarned(earned);
        setRecentTransactions(res.data.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 상단 인사말 */}
      <div className="px-5 pt-12 pb-4 bg-white border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-1">
          {greetingMessage} {greetingEmoji}
        </p>
        <p className="text-xl font-bold text-gray-900">
          안녕하세요,{" "}
          <span className="text-blue-600">{user?.nickname ?? "업폴"}님</span>!
        </p>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-3">
        {/* 시드머니 카드 */}
        <div
          className="relative overflow-hidden rounded-[20px] p-5"
          style={{ background: "#2563EB" }}
        >
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 160,
              height: 160,
              background: "rgba(255,255,255,0.07)",
              top: -40,
              right: -40,
            }}
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 100,
              height: 100,
              background: "rgba(255,255,255,0.05)",
              bottom: -20,
              left: 20,
            }}
          />
          <p className="text-xs text-white/70 font-medium tracking-wide mb-1">
            내 시드머니
          </p>
          <p className="text-[32px] font-extrabold text-white leading-none">
            <span className="text-lg font-semibold opacity-85 mr-0.5">₩</span>
            {cashBalance !== null ?formatWon(cashBalance) : "—"}
          </p>
          <p className="text-xs text-white/60 mt-1.5">
            오늘 퀴즈로{" "}
            <span className="text-green-300 font-semibold">
              +₩{formatWon(todayEarned)}
            </span>{" "}
            획득
          </p>
        </div>

        {/* 퀴즈 카드 */}
        <button
          onClick={() => navigate("/quiz")}
          className="w-full bg-white border border-gray-100 rounded-[20px] px-5 py-4 flex items-center justify-between active:scale-[0.98] transition-transform text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center text-xl shrink-0">
              🚀
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[15px] font-bold text-gray-900">
                  오늘의 퀴즈 풀기
                </p>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  미션
                </span>
              </div>
              <p className="text-[12px] text-gray-400">
                주식 감각을 키우고 보상을 받아보세요
              </p>
            </div>
          </div>
          <span className="text-gray-300 text-xl ml-2">›</span>
        </button>

        {/* 최근 내역 */}
        <RecentTransactions transactions={recentTransactions} />
      </div>
    </div>
  );
};
