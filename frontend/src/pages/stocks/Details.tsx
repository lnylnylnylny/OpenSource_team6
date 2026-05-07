// src/pages/StockDetailPage.tsx
import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Stock } from "@/types/stocks";
import api from "@/api";

export default function StockDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [stock, setStock] = useState<Stock | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"LIMIT" | "MARKET">("LIMIT");
  const [price, setPrice] = useState(0);
  const [volume, setVolume] = useState(10);

  // 실시간 WebSocket
  const { price: livePrice, changeRate: liveChangeRate } = useWebSocket(
    code || "",
  );

  // 종목 정보 + 최근 차트 데이터 불러오기
  useEffect(() => {
    if (!code) return;

    const fetchData = async () => {
      try {
        const stockRes = await api.get(`/stocks/${code}`);
        setStock(stockRes.data);
        setPrice(stockRes.data.last_price || 0);

        // 최근 30일/30개 시세 데이터
        const chartRes = await api.get(`/quotes/${code}/history?days=30`);
        const formatted = chartRes.data.map((q: any) => ({
          time: new Date(q.quote_time).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          price: Number(q.close_price),
        }));
        setChartData(formatted);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [code]);

  // 실시간 가격 반영
  useEffect(() => {
    if (livePrice == null) return;
    setPrice(livePrice);
    setStock((prev) =>
      prev
        ? {
            ...prev,
            last_price: livePrice,
            change_rate: liveChangeRate && prev.change_rate,
          }
        : null,
    );
  }, [livePrice, liveChangeRate]);

  const handleOrder = async () => {
    if (!stock) return;
    try {
        await api.post(`/orders`, {
          stock_code: stock.code,
          side,
          order_type: orderType,
          price: orderType === "LIMIT" ? price : undefined,
          volume,
        });
        alert("주문이 정상 접수되었습니다!");
    } catch (e: any) {
        alert(e.response?.data?.detail || "주문 중 오류가 발생했습니다.");
    }
  };

  if (loading)
    return <div className="p-10 text-center text-gray-500">로딩중...</div>;
  if (!stock)
    return <div className="p-10 text-center">종목을 찾을 수 없습니다.</div>;

  const currentPrice = livePrice || stock.last_price || 0;
  const currentChange =
    liveChangeRate !== 0 ? liveChangeRate : (stock.change_rate ?? 0);

  return (
    <div className="px-5 pt-6 pb-24 bg-gray-50">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-gray-500 flex items-center gap-1 active:scale-95"
      >
        ← 돌아가기
      </button>

      {/* 종목 헤더 */}
      <div className="bg-white rounded-3xl p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-3xl font-bold">{stock.name}</div>
            <div className="text-gray-500">{stock.code}</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-semibold tracking-tighter">
              {currentPrice.toLocaleString()}
            </div>
            <div
              className={`text-lg font-medium ${currentChange >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {currentChange >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(currentChange).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="bg-white rounded-3xl p-5 mb-6">
        <div className="text-sm text-gray-500 mb-3">최근 가격 추이</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={
                chartData.length > 0
                  ? chartData
                  : [{ time: "데이터 없음", price: currentPrice }]
              }
            >
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="natural"
                dataKey="price"
                stroke="#2563EB"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: "#2563EB" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 주문 패널 */}
      <div className="bg-white rounded-3xl p-6">
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          <button
            onClick={() => setSide("BUY")}
            className={`flex-1 py-4 rounded-xl font-semibold ${side === "BUY" ? "bg-blue-600 text-white" : "text-gray-600"}`}
          >
            매수
          </button>
          <button
            onClick={() => setSide("SELL")}
            className={`flex-1 py-4 rounded-xl font-semibold ${side === "SELL" ? "bg-red-600 text-white" : "text-gray-600"}`}
          >
            매도
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <div className="text-sm text-gray-500 mb-2">주문 유형</div>
            <div className="flex gap-3">
              <button
                onClick={() => setOrderType("MARKET")}
                className={`flex-1 py-3 rounded-2xl ${orderType === "MARKET" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
              >
                시장가
              </button>
              <button
                onClick={() => setOrderType("LIMIT")}
                className={`flex-1 py-3 rounded-2xl ${orderType === "LIMIT" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
              >
                지정가
              </button>
            </div>
          </div>

          {orderType === "LIMIT" && (
            <div>
              <div className="text-sm text-gray-500 mb-2">가격 (원)</div>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-2xl font-medium focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <div className="text-sm text-gray-500 mb-2">수량 (주)</div>
            <input
              type="number"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-2xl font-medium focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleOrder}
            className={`w-full py-5 rounded-3xl text-xl font-bold text-white active:scale-95 transition-all ${side === "BUY" ? "bg-blue-600" : "bg-red-600"}`}
          >
            {side === "BUY" ? "매수하기" : "매도하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
