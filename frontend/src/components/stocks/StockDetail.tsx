import { useState } from "react";
import type { Stock } from "@/types/stocks";
import api from "@/api";

export default function StockDetailModal({
  stock,
  onClose,
}: {
  stock: Stock;
  onClose: () => void;
}) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"LIMIT" | "MARKET">("LIMIT");
  const [price, setPrice] = useState(stock.last_price || 0);
  const [volume, setVolume] = useState(10);

  const handleOrder = async () => {
    await api.post(import.meta.env.VITE_API_URL + "/orders", {
      stock_code: stock.code,
      side,
      order_type: orderType,
      price: orderType === "LIMIT" ? price : undefined,
      volume,
    });
    alert("주문이 정상 접수되었습니다!");
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black/60 z-[100] flex items-end">
      <div className="bg-white w-full rounded-t-3xl max-h-[92%] overflow-auto animate-slide-up">
        {/* 핸들 */}
        <div className="w-11 h-1 bg-gray-300 rounded-full mx-auto mt-3" />

        <div className="px-6 pt-2 pb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-2xl font-bold">{stock.name}</div>
              <div className="text-gray-500">{stock.code}</div>
            </div>
            <button onClick={onClose} className="text-gray-400 text-2xl">
              ✕
            </button>
          </div>

          {/* 현재가 */}
          <div className="text-center mb-8">
            <div className="text-5xl font-semibold tracking-tighter text-gray-900">
              {stock.last_price?.toLocaleString()}
            </div>
            <div
              className={`text-xl font-medium mt-1 ${(stock.change_rate ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {(stock.change_rate ?? 0) >= 0 ? "+" : ""}
              {stock.change_rate?.toFixed(2)}%
            </div>
          </div>

          {/* 주문 영역 */}
          <div className="space-y-6">
            {/* 매수/매도 탭 */}
            <div className="flex bg-gray-100 rounded-2xl p-1">
              <button
                onClick={() => setSide("BUY")}
                className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all ${side === "BUY" ? "bg-blue-600 text-white shadow" : "text-gray-600"}`}
              >
                매수
              </button>
              <button
                onClick={() => setSide("SELL")}
                className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all ${side === "SELL" ? "bg-red-600 text-white shadow" : "text-gray-600"}`}
              >
                매도
              </button>
            </div>

            {/* 주문 유형 */}
            <div className="flex gap-3">
              <button
                onClick={() => setOrderType("MARKET")}
                className={`flex-1 py-3 rounded-2xl font-medium ${orderType === "MARKET" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                시장가
              </button>
              <button
                onClick={() => setOrderType("LIMIT")}
                className={`flex-1 py-3 rounded-2xl font-medium ${orderType === "LIMIT" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                지정가
              </button>
            </div>

            {orderType === "LIMIT" && (
              <div>
                <div className="text-sm text-gray-500 mb-2">가격</div>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-2xl font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <div className="text-sm text-gray-500 mb-2">수량 (주)</div>
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-2xl font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleOrder}
              className={`w-full py-5 rounded-3xl text-xl font-bold text-white active:scale-95 transition-all duration-200 shadow-lg ${side === "BUY" ? "bg-blue-600" : "bg-red-600"}`}
            >
              {side === "BUY" ? "매수하기" : "매도하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
