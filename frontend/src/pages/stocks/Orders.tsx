// pages/OrdersPage.tsx
import { useState, useEffect } from "react";
import type { Order } from "@/types/stocks";
import api from "@/api";
import { useNavigate } from "react-router";
import { FiArrowLeft } from "react-icons/fi";
import { formatWon } from "@/api/numbers";

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "FILLED">("ALL");

  useEffect(() => {
    api
      .get("/orders/me", {
        params: { status: filter === "ALL" ? undefined : filter },
      })
      .then((res) => setOrders(res.data));
  }, [filter]);

  const getStatusColor = (status: string) => {
    if (status === "FILLED") return "bg-green-100 text-green-700";
    if (status === "PENDING") return "bg-blue-100 text-blue-700";
    if (status === "PARTIAL") return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="px-5 pt-6 pb-20">
      {/* 상단 뒤로가기 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-gray-600 active:scale-95 transition-transform"
        >
          <FiArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">거래 내역</h1>
      </div>

      {/* 필터 탭 */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
        {["ALL", "PENDING", "FILLED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              filter === f ? "bg-white shadow text-gray-900" : "text-gray-500"
            }`}
          >
            {f === "ALL" ? "전체" : f === "PENDING" ? "미체결" : "체결완료"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl py-20 text-center text-gray-400">
            주문 내역이 없습니다
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-5 active:scale-[0.985] transition-transform shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-lg ${
                        order.side === "BUY" ? "text-blue-600" : "text-red-600"
                      }`}
                    >
                      {order.side === "BUY" ? "매수" : "매도"}
                    </span>
                    <span className="font-semibold">{order.stock_code}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {new Date(order.created_at).toLocaleString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    order.status,
                  )}`}
                >
                  {order.status === "FILLED"
                    ? "체결완료"
                    : order.status === "PENDING"
                      ? "미체결"
                      : "부분체결"}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">주문가격</div>
                  <div className="font-medium mt-0.5">
                    {order.order_type === "MARKET"
                      ? "시장가"
                      : `${formatWon(order.price)}원`}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">주문수량</div>
                  <div className="font-medium mt-0.5">
                    {formatWon(order.volume)}주
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">체결수량</div>
                  <div className="font-medium mt-0.5">
                    {formatWon(order.filled_volume)}주
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">주문유형</div>
                  <div className="font-medium mt-0.5">
                    {order.order_type === "LIMIT" ? "지정가" : "시장가"}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
