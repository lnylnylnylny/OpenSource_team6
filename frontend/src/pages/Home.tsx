import { useNavigate } from "react-router";
import { useAuthStore } from "../store/authStore";
import { NavBar } from "../components/NavBar";
import { Attendance } from "../components/Attendance";

export const Home = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // 임시 더미 데이터 — 나중에 API 연결
  const seedMoney = 1_248_500;
  const todayEarned = 12_000;
  const streakDays = 5;
  const thisWeek = [true, true, true, true, false, false, false];
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <div className="min-h-screen flex flex-col">
      {/* 상단 인사말 */}
      <div className="px-5 pt-12 pb-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-1">좋은 아침이에요 ☀️</p>
        <p className="text-xl font-bold text-gray-900">
          안녕하세요,{" "}
          <span className="text-blue-600">{user?.nickname ?? "업폴"}님</span>!
        </p>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-3">
        {/* 시드머니 카드 */}
        <div
          className="relative overflow-hidden rounded-[20px] p-5"
          style={{ background: "#2563EB" }}
        >
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 160,
              height: 160,
              background: "rgba(255,255,255,0.07)",
              top: -40,
              right: -40,
            }}
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 100,
              height: 100,
              background: "rgba(255,255,255,0.05)",
              bottom: -20,
              left: 20,
            }}
          />
          <p className="text-xs text-white/70 font-medium tracking-wide mb-1">
            내 시드머니
          </p>
          <p className="text-[32px] font-extrabold text-white leading-none">
            <span className="text-lg font-semibold opacity-85 mr-0.5">₩</span>
            {seedMoney.toLocaleString()}
          </p>
          <p className="text-xs text-white/60 mt-1.5">
            오늘 퀴즈로{" "}
            <span className="text-green-300 font-semibold">
              +₩{todayEarned.toLocaleString()}
            </span>{" "}
            획득
          </p>
        </div>

        {/* 퀴즈 이동 버튼 */}
        <button
          onClick={() => navigate("/quiz")}
          className="w-full bg-blue-50 rounded-2xl px-5 py-4 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl">
              🚀
            </div>
            <div className="text-left">
              <p className="text-[15px] font-bold text-blue-700">
                오늘의 퀴즈 풀기
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                주식 감각을 키워보세요
              </p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-blue-700 text-2xl">⭢</span>
          </div>
        </button>

        {/* 출석 스트릭 */}
        <Attendance
          streakDays={streakDays}
          thisWeek={thisWeek}
          todayIndex={todayIndex}
        />
      </div>

      <NavBar />
    </div>
  );
};
