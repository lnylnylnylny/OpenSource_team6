// 추후 API 연동 시 props로 교체
const mockHoldings = [
  {
    name: "삼성전자",
    ticker: "005930",
    quantity: 10,
    avgPrice: 72_000,
    currentPrice: 78_500,
  },
  {
    name: "카카오",
    ticker: "035720",
    quantity: 5,
    avgPrice: 48_000,
    currentPrice: 44_200,
  },
  {
    name: "NAVER",
    ticker: "035420",
    quantity: 3,
    avgPrice: 195_000,
    currentPrice: 212_000,
  },
  {
    name: "SK하이닉스",
    ticker: "000660",
    quantity: 4,
    avgPrice: 158_000,
    currentPrice: 171_000,
  },
];

export const HoldingsTable = () => {
  return (
    <div className="px-4 pt-4">
      <p className="text-xs font-medium text-gray-400 mb-3">보유 종목</p>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="grid grid-cols-4 px-4 py-2 border-b border-gray-100">
          <p className="text-xs text-gray-400">종목</p>
          <p className="text-xs text-gray-400 text-center">평균가</p>
          <p className="text-xs text-gray-400 text-center">현재가</p>
          <p className="text-xs text-gray-400 text-right">손익</p>
        </div>

        {/* 테이블 바디 */}
        {mockHoldings.map((item, index) => {
          const pl = (item.currentPrice - item.avgPrice) * item.quantity;
          const plRate =
            ((item.currentPrice - item.avgPrice) / item.avgPrice) * 100;
          const isUp = pl >= 0;

          return (
            <div
              key={item.ticker}
              className={`grid grid-cols-4 px-4 py-3 items-center ${
                index < mockHoldings.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              {/* 종목명 */}
              <div>
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-[11px] text-gray-300 mt-0.5">
                  {item.ticker}
                </p>
              </div>

              {/* 평균가 */}
              <p className="text-xs text-gray-500 text-center">
                {item.avgPrice.toLocaleString()}
              </p>

              {/* 현재가 */}
              <p className="text-xs text-gray-500 text-center">
                {item.currentPrice.toLocaleString()}
              </p>

              {/* 손익률 */}
              <p
                className={`text-xs font-semibold text-right ${
                  isUp ? "text-[#1D9E75]" : "text-red-500"
                }`}
              >
                {isUp ? "+" : ""}
                {plRate.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
