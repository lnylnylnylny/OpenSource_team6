import { useState } from "react";
import axios from "axios";
import { QuizCard } from "../components/QuizCard";
import SmartHamster from "../assets/images/smart_hamster.jpg";

interface QuizData {
  id: number;
  question: string;
  options: string;
  answer: number;
  explanation: string;
  difficulty: string;
}

const DIFFICULTY_CONFIG = {
  하: {
    emoji: "🌱",
    label: "쉬움",
    desc: "기초 금융 상식",
    reward: "₩500,000",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
  },
  중: {
    emoji: "🔥",
    label: "보통",
    desc: "주식 기본 개념",
    reward: "₩1,000,000",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
  },
  상: {
    emoji: "⚡",
    label: "어려움",
    desc: "심화 투자 전략",
    reward: "₩1,500,000",
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
  },
} as const;

export const Quiz = () => {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLevel, setLoadingLevel] = useState<string | null>(null);

  const handleStartQuiz = async (difficulty: string) => {
    setLoading(true);
    setLoadingLevel(difficulty);
    try {
      const response = await axios.get(
        `http://localhost:8000/api/quizzes/random`,
        { params: { difficulty } }
      );
      setQuiz(response.data);
    } catch (error) {
      console.error("퀴즈 로딩 실패:", error);
      alert("문제를 불러오지 못했습니다. 서버 상태를 확인해주세요.");
    } finally {
      setLoading(false);
      setLoadingLevel(null);
    }
  };

  if (quiz) {
    return <QuizCard quiz={quiz} onNext={() => setQuiz(null)} />;
  }

  return (
    <div className="w-full overflow-x-hidden min-h-screen flex flex-col pb-[83px]">
      {/* 헤더 */}
      <div
        className="relative overflow-hidden px-6 pt-14 pb-10"
        style={{ background: "#2563EB" }}
      >
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 180,
            height: 180,
            background: "rgba(255,255,255,0.07)",
            top: -50,
            right: -50,
          }}
        />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-white/30">
            <img
              src={SmartHamster}
              alt="똑똑한 햄스터"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-white/70 text-xs font-medium mb-0.5">
              오늘의 미션
            </p>
            <h1 className="text-white text-xl font-bold leading-tight break-keep">
              금융 퀴즈에 도전해보세요! 💰
            </h1>
            <p className="text-white/60 text-xs mt-1">
              맞히면 시드머니 보상이 지급돼요
            </p>
          </div>
        </div>
      </div>

      {/* 난이도 선택 */}
      <div className="flex-1 px-4 py-5 flex flex-col gap-3">
        <p className="text-[13px] font-semibold text-gray-500 px-1 mb-1">
          난이도를 선택하세요
        </p>
        {(["하", "중", "상"] as const).map((level) => {
          const cfg = DIFFICULTY_CONFIG[level];
          const isLoading = loadingLevel === level;
          return (
            <button
              key={level}
              onClick={() => handleStartQuiz(level)}
              disabled={loading}
              className={`w-full ${cfg.bg} border ${
                cfg.border
              } rounded-[18px] px-5 py-4 flex items-center justify-between active:scale-[0.98] transition-transform text-left cursor-pointer ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm shrink-0">
                  {cfg.emoji}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[15px] font-bold text-gray-900">
                      난이도 {level}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-400">{cfg.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[13px] font-bold text-gray-700">
                  {isLoading ? "..." : `+${cfg.reward}`}
                </span>
                <span className="text-gray-300 text-xl">›</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
