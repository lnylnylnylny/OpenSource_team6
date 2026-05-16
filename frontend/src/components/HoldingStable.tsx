import type { Holding } from "@/types/stocks";

interface HoldingsTableProps {
  holdings: Holding[];
  onSelect?: (holding: Holding) => void;
}

export const HoldingsTable = ({ holdings, onSelect }: HoldingsTableProps) => {
  if (holdings.length === 0) {
    return (
      <div className="px-4 pt-4">
        <p className="text-xs font-medium text-gray-400 mb-3">보유 종목</p>
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-10 text-center text-sm text-gray-400">
          보유 종목이 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      <p className="text-xs font-medium text-gray-400 mb-3">보유 종목</p>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-4 px-4 py-2 border-b border-gray-100">
          <p className="text-xs text-gray-400">종목</p>
          <p className="text-xs text-gray-400 text-center">평균가</p>
          <p className="text-xs text-gray-400 text-center">현재가</p>
          <p className="text-xs text-gray-400 text-right">손익</p>
        </div>

        {holdings.map((item, index) => {
          const isUp = item.pnl_rate >= 0;

          return (
            <div
              key={item.stock_code}
              onClick={() => onSelect?.(item)}
              className={`grid grid-cols-4 px-4 py-3 items-center ${
                index < holdings.length - 1 ? "border-b border-gray-50" : ""
              } ${onSelect ? "cursor-pointer active:bg-gray-50" : ""}`}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{item.stock_name}</p>
                <p className="text-[11px] text-gray-300 mt-0.5">{item.stock_code}</p>
              </div>

              <p className="text-xs text-gray-500 text-center">
                {Number(item.avg_price).toLocaleString()}
              </p>

              <p className="text-xs text-gray-500 text-center">
                {item.current_price != null ? Number(item.current_price).toLocaleString() : "-"}
              </p>

              <p className={`text-xs font-semibold text-right ${isUp ? "text-[#1D9E75]" : "text-red-500"}`}>
                {isUp ? "+" : ""}
                {Number(item.pnl_rate).toFixed(1)}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
