// src/pages/PortfolioPage.tsx
import { useState, useEffect } from "react";
import type { Holding } from "@/types/stocks";
import { useNavigate } from "react-router";
import api from "@/api";

// react-icons import
import { FiSearch, FiClipboard } from "react-icons/fi";
import { formatWon } from "@/api/numbers";

export default function PortfolioPage() {
  const navigate = useNavigate();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [balance, setBalance] = useState<any>(null);

  useEffect(() => {
    api.get("/balance/me").then((res) => setBalance(res.data));
    api.get("/balance/holdings").then((res) => setHoldings(res.data));
  }, []);

  return (
    <div className="px-5 pt-6 pb-20">
      {/* 상단 액션 버튼 */}
      <div className="flex gap-3 mb-7">
        {/* 종목 탐색 버튼 */}
        <button
          onClick={() => navigate("/stocks/list")}
          className="flex-1 flex items-center justify-center gap-2.5 bg-white border border-gray-200 hover:border-gray-300 active:bg-gray-50 transition-all rounded-2xl py-4 text-gray-800 font-medium"
        >
          <FiSearch className="w-5 h-5" />
          <span>종목 탐색</span>
        </button>

        {/* 거래 내역 버튼 */}
        <button
          onClick={() => navigate("/stocks/orders")}
          className="flex-1 flex items-center justify-center gap-2.5 bg-white border border-gray-200 hover:border-gray-300 active:bg-gray-50 transition-all rounded-2xl py-4 text-gray-800 font-medium"
        >
          <FiClipboard className="w-5 h-5" />
          <span>거래 내역</span>
        </button>
      </div>

      {/* 잔고 카드 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl p-6 mb-8 shadow">
        <div className="text-blue-100 text-sm">총 평가금액</div>
        <div className="text-4xl font-semibold mt-2 tracking-tighter">
          {formatWon(balance?.total_balance)}원
        </div>

        <div className="flex justify-between mt-6">
          <div>
            <div className="text-blue-100 text-sm">보유 현금</div>
            <div className="font-medium text-xl">
              {formatWon(balance?.cash_balance)}원
            </div>
          </div>
          <div className="text-right">
            <div className="text-blue-100 text-sm">총 손익</div>
            <div
              className={`font-medium text-xl ${(balance?.total_pnl ?? 0) >= 0 ? "text-green-300" : "text-red-300"}`}
            >
              {(balance?.total_pnl ?? 0) >= 0 ? "+" : ""}
              {formatWon(balance?.total_pnl)}원
            </div>
          </div>
        </div>
      </div>

      {/* 보유 종목 */}
      <div className="mb-4 px-1 flex justify-between">
        <div className="font-semibold text-lg">보유 종목</div>
        <div className="text-sm text-gray-500">{holdings.length}개</div>
      </div>

      <div className="space-y-4">
        {holdings.map((h) => (
          <div
            key={h.stock_symbol}
            onClick={() => navigate(`/stocks/${h.stock_symbol}`)}
            className="bg-white rounded-3xl p-5 active:scale-[0.985] transition-all cursor-pointer"
          >
            <div className="flex justify-between">
              <div>
                <div className="font-semibold text-xl">{h.stock_name}</div>
                <div className="text-gray-500">{h.stock_symbol}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-2xl">
                  {formatWon(h.current_value)}원
                </div>
                <div className="text-sm text-gray-500">
                  {h.quantity.toLocaleString()}주
                </div>
              </div>
            </div>

            <div
              className={`mt-3 text-right font-medium ${h.pnl_rate >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {h.pnl_rate >= 0 ? "+" : ""}
              {h.pnl_rate}% ({formatWon(h.pnl)}원)
            </div>
          </div>
        ))}

        {holdings.length === 0 && (
          <div className="bg-white rounded-3xl py-16 text-center text-gray-400">
            보유 종목이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
