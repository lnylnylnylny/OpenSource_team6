import type { Balance } from "@/types/stocks";

interface InvestmentSummaryProps {
  balance: Balance;
}

export const InvestmentSummary = ({ balance }: InvestmentSummaryProps) => {
  const totalBalance = Number(balance.total_balance);
  const cashBalance = Number(balance.cash_balance);
  const totalPnl = Number(balance.total_pnl);
  const totalPnlRate = Number(balance.total_pnl_rate);

  const investedAmount = totalBalance - cashBalance;
  const investedRatio =
    totalBalance > 0 ? Math.round((investedAmount / totalBalance) * 100) : 0;
  const isProfit = totalPnl >= 0;

  return (
    <div className="px-4 pt-4">
      <div className="bg-[#f0faf6] border border-[#9FE1CB] rounded-2xl p-4 mb-3">
        <p className="text-xs text-[#0F6E56] mb-1">총 평가금액</p>
        <p className="text-3xl font-bold text-[#085041] mb-4">
          {totalBalance.toLocaleString()}
          <span className="text-sm font-medium text-[#0F6E56] ml-1">원</span>
        </p>

        <div className="w-full h-2 bg-[#C8EFE3] rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-[#1D9E75] rounded-full transition-all duration-500"
            style={{ width: `${investedRatio}%` }}
          />
        </div>

        <div className="flex justify-between">
          <p className="text-xs text-[#0F6E56]">
            투자 중 {investedAmount.toLocaleString()}원 ({investedRatio}%)
          </p>
          <p className="text-xs text-[#0F6E56]">
            가용 {cashBalance.toLocaleString()}원
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">평가 손익</p>
          <p
            className={`text-2xl font-bold ${
              isProfit ? "text-[#1D9E75]" : "text-red-500"
            }`}
          >
            {isProfit ? "+" : ""}
            {totalPnl.toLocaleString()}
            <span className="text-sm font-medium ml-1">원</span>
          </p>
          <p
            className={`text-xs mt-1 ${
              isProfit ? "text-[#1D9E75]" : "text-red-500"
            }`}
          >
            {isProfit ? "▲" : "▼"} {Math.abs(totalPnlRate).toFixed(2)}%
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
