import { useState } from "react";
import axios from "axios";

interface QuizProps {
  quiz: {
    id: number;
    question: string;
    options: string;
    answer: number;
    explanation: string;
    difficulty: string;
  };
  onNext: () => void;
}

const DIFFICULTY_LABEL: Record<string, { label: string; color: string }> = {
  하: { label: "쉬움", color: "bg-emerald-500" },
  중: { label: "보통", color: "bg-amber-500" },
  상: { label: "어려움", color: "bg-red-500" },
};

export const QuizCard = ({ quiz, onNext }: QuizProps) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reward, setReward] = useState<number>(0);

  const optionsArray = quiz.options.split(",");
  const diffInfo = DIFFICULTY_LABEL[quiz.difficulty] ?? {
    label: quiz.difficulty,
    color: "bg-blue-500",
  };
  const isCorrect = isSubmitted && selectedIdx === quiz.answer;

  const handleNext = () => {
    setIsSubmitted(false);
    setSelectedIdx(null);
    setReward(0);
    onNext();
  };

  const handleSubmit = async () => {
    if (selectedIdx === null) return;
    const token = localStorage.getItem("accessToken");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/quizzes/submit`,
        { quiz_id: quiz.id, selected_answer: selectedIdx },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReward(res.data.reward ?? 0);
    } catch {
      setReward(0);
    }
    setIsSubmitted(true);
  };

  const getOptionStyle = (i: number) => {
    if (!isSubmitted) {
      return selectedIdx === i
        ? "border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm"
        : "border border-gray-200 bg-white text-gray-800 hover:border-blue-200 hover:bg-blue-50/40";
    }
    if (i === quiz.answer)
      return "border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold";
    if (i === selectedIdx)
      return "border-2 border-red-400 bg-red-50 text-red-600";
    return "border border-gray-200 bg-white text-gray-400";
  };

  return (
    <div className="flex flex-col w-full h-screen mx-auto relative overflow-hidden">
      {/* 상단 헤더 */}
      <div
        className="relative overflow-hidden shrink-0 px-6 pt-14 pb-10"
        style={{ background: "#2563EB" }}
      >
        {/* 장식 원 */}
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

        <div className="flex items-start gap-3">
          {/* 뒤로가기 */}
          <button
            className="w-8 h-8 mt-1 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer shrink-0"
            onClick={onNext}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex items-start gap-3.5 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-xl shrink-0">
              {quiz.difficulty === "하" ? "🌱" : quiz.difficulty === "중" ? "🔥" : "⚡"}
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium mb-0.5">
                {diffInfo.label} 난이도
              </p>
              <h2 className="text-white text-[18px] font-bold leading-[28px] break-keep">
                {quiz.question}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* 선택지 + 결과 영역 */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32">
        <div className="flex flex-col gap-3">
          {optionsArray.map((option, i) => (
            <button
              key={i}
              disabled={isSubmitted}
              onClick={() => setSelectedIdx(i)}
              className={`w-full min-h-[60px] px-4 py-3.5 flex items-center gap-3 rounded-[14px] text-left transition-all duration-150 ${
                isSubmitted
                  ? "cursor-default"
                  : "cursor-pointer active:scale-[0.98]"
              } ${getOptionStyle(i)}`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${
                  selectedIdx === i && !isSubmitted
                    ? "bg-blue-600 text-white"
                    : isSubmitted && i === quiz.answer
                    ? "bg-emerald-500 text-white"
                    : isSubmitted && i === selectedIdx
                    ? "bg-red-400 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {i + 1}
              </span>
              <span className="text-[14px] leading-[20px] break-keep">
                {option.trim()}
              </span>
              {isSubmitted && i === quiz.answer && (
                <span className="ml-auto text-emerald-500 text-lg shrink-0">
                  ✓
                </span>
              )}
              {isSubmitted && i === selectedIdx && i !== quiz.answer && (
                <span className="ml-auto text-red-400 text-lg shrink-0">✗</span>
              )}
            </button>
          ))}
        </div>

        {/* 해설 박스 */}
        {isSubmitted && (
          <div className="mt-4 rounded-[16px] overflow-hidden border border-gray-100">
            <div
              className={`px-4 py-3 flex items-center gap-2 ${
                isCorrect ? "bg-emerald-500" : "bg-red-400"
              }`}
            >
              <span className="text-white text-lg">
                {isCorrect ? "🎉" : "😢"}
              </span>
              <span className="text-white font-bold text-[14px]">
                {isCorrect ? "정답이에요!" : "아쉬워요.."}
              </span>
              {isCorrect && reward > 0 && (
                <span className="ml-auto text-white font-bold text-[13px]">
                  +{reward.toLocaleString()}원 지급
                </span>
              )}
            </div>
            <div className="bg-white px-4 py-3">
              <p className="text-gray-600 text-[13px] leading-[20px] break-keep">
                {quiz.explanation}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="absolute bottom-20 left-0 right-0 px-4 pb-6 pt-3 ">
        <button
          onClick={isSubmitted ? handleNext : handleSubmit}
          disabled={selectedIdx === null && !isSubmitted}
          className={`w-full h-[54px] rounded-[14px] text-white text-[16px] font-bold transition-all active:scale-[0.98] ${
            selectedIdx !== null || isSubmitted
              ? "bg-blue-600 shadow-md shadow-blue-200 cursor-pointer"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {isSubmitted ? "다음 문제 도전하기" : "제출하기"}
        </button>
      </div>
    </div>
  );
};
