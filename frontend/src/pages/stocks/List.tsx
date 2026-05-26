import { useState, useEffect } from "react";
import axios from "axios";
import type { Stock } from "@/types/stocks";
import StockDetailModal from "@/components/stocks/StockDetail";
import { useNavigate } from "react-router";
import { FiArrowLeft } from "react-icons/fi";

const StockListPage = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  useEffect(() => {
    axios
      .get(import.meta.env.VITE_API_URL + "/stocks", { params: { search } })
      .then((res) => setStocks(res.data));
  }, [search]);

  const navigate = useNavigate();

  return (
    <div className="px-4 pt-4">
      {/* 상단 뒤로가기 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">모의투자</h1>
      </div>
      {/* 검색창 */}
      <div className="relative mb-5">
        <input
          type="text"
          placeholder="종목명 또는 코드 검색"
          className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-base focus:outline-none focus:border-blue-500 transition"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 종목 리스트 */}
      <div className="space-y-3">
        {stocks.map((stock) => (
          <div
            key={stock.symbol}
            // onClick={() => setSelectedStock(stock)}
            onClick={() => navigate(`/stocks/${stock.symbol}`)}
            className="bg-white rounded-3xl p-5 active:scale-[0.985] transition-transform duration-200 shadow-sm border border-gray-100 cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-lg text-gray-900">
                  {stock.name}
                </div>
                <div className="text-sm text-gray-500">{stock.symbol}</div>
              </div>

              <div className="text-right">
                <div className="font-mono text-xl font-semibold text-gray-900">
                  {stock.last_price?.toLocaleString() ?? "-"}
                </div>
                <div
                  className={`text-sm font-medium ${
                    (stock.change_rate ?? 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {(stock.change_rate ?? 0) >= 0 ? "▲ " : "▼ "}
                  {Math.abs(stock.change_rate ?? 0).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 종목 상세 모달 */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
};

export default StockListPage;
