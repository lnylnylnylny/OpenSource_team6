export type Transaction = {
  type: string;
  description?: string;
  amount: string;
  created_at: string;
};

const TX_ICON: Record<string, string> = {
  DEPOSIT: "📥",
  WITHDRAW: "📤",
  BUY: "📉",
  SELL: "📈",
};

const isIncoming = (type: string) => type === "DEPOSIT" || type === "SELL";

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "오늘";
  if (d.toDateString() === yesterday.toDateString()) return "어제";
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const formatLabel = (tx: Transaction) => {
  if (tx.description) return tx.description;
  if (tx.type === "DEPOSIT") return "입금";
  if (tx.type === "WITHDRAW") return "출금";
  return tx.type;
};

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export const RecentTransactions = ({
  transactions,
}: RecentTransactionsProps) => {
  if (transactions.length === 0) return null;

  return (
    <div className="bg-white rounded-[18px] border border-gray-100 p-4">
      <p className="text-[13px] font-bold text-gray-800 mb-3">최근 내역</p>
      <div className="flex flex-col gap-2.5">
        {transactions.map((tx, i) => {
          const positive = isIncoming(tx.type);
          const amount = Math.abs(Number(tx.amount));
          return (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] ${
                    positive ? "bg-blue-50" : "bg-red-50"
                  }`}
                >
                  {TX_ICON[tx.type] ?? "💳"}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-gray-800 leading-tight">
                    {formatLabel(tx)}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {formatDate(tx.created_at)}
                  </p>
                </div>
              </div>
              <p
                className={`text-[14px] font-bold ${
                  positive ? "text-blue-600" : "text-red-500"
                }`}
              >
                {positive ? "+" : "-"}₩{amount.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
