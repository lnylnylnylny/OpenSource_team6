import { HoldingsTable } from "../components/HoldingStable";
import { InvestmentSummary } from "../components/InvestmentSummary";
import { NavBar } from "../components/NavBar";
import { useAuthStore } from "../store/authStore";
import { profile } from "../assets";
import { EditProfile } from "../components/EditProfile";
import { useState } from "react";

export const Mypage = () => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  return (
    <div>
      <div className=" px-5 pt-10 pb-6 ">
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
              className="text-xs text-gray-400 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
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

      <InvestmentSummary />
      <HoldingsTable />
      <NavBar />
    </div>
  );
};
