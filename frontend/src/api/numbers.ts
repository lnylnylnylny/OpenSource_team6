// 금액 포맷팅 함수
export const formatWon = (amount: number | null | undefined): string => {
  if (amount == null) return "0";
  const rounded = Math.round(amount);
  return rounded.toLocaleString("ko-KR");
};
