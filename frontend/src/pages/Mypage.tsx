import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../store/authStore";
import { profile } from "../assets";
import { EditProfile } from "../components/EditProfile";
import { InvestmentSummary } from "../components/InvestmentSummary";
import { HoldingsTable } from "../components/HoldingStable";
import api from "../api";
import type { Balance, Holding } from "../types/stocks";
import { FiSearch, FiClipboard } from "react-icons/fi";

export const Mypage = () => {
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);

  useEffect(() => {
    api
      .get("/balance/me")
      .then((res) => setBalance(res.data))
      .catch(() => {});
    api
      .get("/balance/holdings")
      .then((res) => setHoldings(res.data))
      .catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen pb-24">
      {/* 프로필 */}
      <div className="bg-white px-5 pt-10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={user.profile_image || profile}
              alt="프로필"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex items-center justify-between flex-1">
            <div className="flex flex-col gap-1.5">
              <p className="text-[17px] font-semibold text-gray-900 leading-none">
                {user.nickname} 님
              </p>
              <p className="text-xs text-gray-400 leading-none">
                카카오 로그인
              </p>
            </div>

            <button
              onClick={() => setIsEditOpen(true)}
              className="text-xs text-gray-500 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
            >
              정보수정
            </button>
            <EditProfile
              isOpen={isEditOpen}
              onClose={() => setIsEditOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3 px-4 pt-1">
        <button
          onClick={() => navigate("/stocks/list")}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 active:bg-gray-50 transition-all rounded-2xl py-4 text-gray-800 font-medium cursor-pointer"
        >
          <FiSearch className="w-5 h-5" />
          <span>종목 탐색</span>
        </button>
        <button
          onClick={() => navigate("/stocks/orders")}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 active:bg-gray-50 transition-all rounded-2xl py-4 text-gray-800 font-medium cursor-pointer"
        >
          <FiClipboard className="w-5 h-5" />
          <span>거래 내역</span>
        </button>
      </div>

      {/* 투자 요약 */}
      {balance && <InvestmentSummary balance={balance} />}

      {/* 보유 종목 — 클릭 시 종목 상세로 이동 */}
      <HoldingsTable
        holdings={holdings}
        onSelect={(h) => navigate(`/stocks/${h.stock_code}`)}
      />
    </div>
  );
};
