// 추후 API 연동 시 props로 교체
const mockInvestment = {
  seedMoney: 2_500_000,
  investedAmount: 1_850_000,
  returnAmount: 142_300,
  returnRate: 7.69,
};

export const InvestmentSummary = () => {
  const { seedMoney, investedAmount, returnAmount, returnRate } =
    mockInvestment;

  const availableCash = seedMoney - investedAmount;
  const investedRatio = Math.round((investedAmount / seedMoney) * 100);
  const isProfit = returnAmount >= 0;

  return (
    <div className="px-4 pt-4">
      {/* 시드머니 큰 카드 */}
      <div className="bg-[#f0faf6] border border-[#9FE1CB] rounded-2xl p-4 mb-3">
        <p className="text-xs text-[#0F6E56] mb-1">보유 시드머니</p>
        <p className="text-3xl font-bold text-[#085041] mb-4">
          {seedMoney.toLocaleString()}
          <span className="text-sm font-medium text-[#0F6E56] ml-1">원</span>
        </p>

        {/* 투자 진행 바 */}
        <div className="w-full h-2 bg-[#C8EFE3] rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-[#1D9E75] rounded-full transition-all duration-500"
            style={{ width: `${investedRatio}%` }}
          />
        </div>

        {/* 바 아래 메타 */}
        <div className="flex justify-between">
          <p className="text-xs text-[#0F6E56]">
            투자 중 {investedAmount.toLocaleString()}원 ({investedRatio}%)
          </p>
          <p className="text-xs text-[#0F6E56]">
            가용 {availableCash.toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 평가 손익 / 투자 비율 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">평가 손익</p>
          <p
            className={`text-2xl font-bold ${
              isProfit ? "text-[#1D9E75]" : "text-red-500"
            }`}
          >
            {isProfit ? "+" : ""}
            {returnAmount.toLocaleString()}
            <span className="text-sm font-medium ml-1">원</span>
          </p>
          <p
            className={`text-xs mt-1 ${
              isProfit ? "text-[#1D9E75]" : "text-red-500"
            }`}
          >
            {isProfit ? "▲" : "▼"} {Math.abs(returnRate).toFixed(2)}%
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">투자 비율</p>
          <p className="text-2xl font-bold text-gray-900">
            {investedRatio}
            <span className="text-sm font-medium text-gray-400 ml-1">%</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">시드 대비</p>
        </div>
      </div>
    </div>
  );
};
