import React, { useState } from 'react';
import axios from 'axios';

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

export const QuizCard = ({ quiz, onNext }: QuizProps) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reward, setReward] = useState<number>(0);

  const optionsArray = quiz.options.split(',');

  const handleNext = () => {
    setIsSubmitted(false);
    setSelectedIdx(null);
    setReward(0);
    onNext();
  };

  const handleSubmit = async () => {
    if (selectedIdx === null) return;
    const token = localStorage.getItem('accessToken');
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

  return (
    /* [수정 1] h-screen으로 전체 높이를 고정하여 화면 밖으로 나가지 않게 함 */
    <div className="flex flex-col w-full max-w-[393px] h-screen bg-white mx-auto relative overflow-hidden border-x border-gray-100">
      
      {/* 상단 영역: 파란색 배경 */}
      <div className="bg-[#3182F7] w-full h-[45%] p-8 pt-20 flex flex-col relative shrink-0">
        <button 
          className="absolute top-14 left-6 hover:opacity-70 transition-opacity cursor-pointer z-30" 
          onClick={() => onNext()}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        
        <div className="mb-4 shrink-0">
          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
            LEVEL: {quiz.difficulty}
          </span>
        </div>
        
        {/* [수정 2] 질문이 길면 이 안에서만 스크롤되도록 설정 */}
        <div className="overflow-y-auto pr-2 custom-scrollbar">
          <h2 className="text-white text-[24px] font-semibold leading-[34px] break-keep">
            {quiz.question}
          </h2>
        </div>
      </div>

      {/* 
        선택지 영역: 
        [수정 3] flex-1과 overflow-y-auto를 사용하여 하단 버튼과 네비게이션 바 공간을 확보 
      */}
      <div className="flex-1 bg-[#F2F2F6] rounded-t-[30px] -mt-10 p-5 shadow-inner relative z-10 overflow-y-auto pb-32">
        <div className="grid grid-cols-2 gap-3 mt-4">
          {optionsArray.map((option, i) => (
            <button
              key={i}
              disabled={isSubmitted}
              onClick={() => setSelectedIdx(i)}
              className={`h-[100px] p-4 flex items-center justify-center text-center text-[14px] leading-[20px] rounded-[15px] transition-all duration-200 
              ${isSubmitted ? "cursor-default" : "cursor-pointer active:scale-95 hover:bg-gray-50"}
              ${
                selectedIdx === i 
                  ? "border-2 border-[#0064FF] text-[#0064FF] font-bold bg-white shadow-md" 
                  : "border border-[#D1D6DA] text-black bg-white"
              } ${
                isSubmitted && i === quiz.answer ? "border-2 border-green-500 bg-green-50" : ""
              } ${
                isSubmitted && i === selectedIdx && i !== quiz.answer ? "border-2 border-red-500 bg-red-50" : ""
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {/* 해설 박스 */}
        {isSubmitted && (
          <div className="mt-6 p-5 bg-white rounded-[15px] border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <span className={`block mb-1 font-bold ${selectedIdx === quiz.answer ? "text-green-600" : "text-red-600"}`}>
              {selectedIdx === quiz.answer ? "정답이에요! 🎉" : "아쉬워요.. 😢"}
            </span>
            {selectedIdx === quiz.answer && reward > 0 && (
              <span className="block mb-2 text-[14px] font-semibold text-green-500">
                +{reward.toLocaleString()}원이 지급되었어요!
              </span>
            )}
            <p className="text-gray-600 text-[14px] leading-[20px] break-keep">
              {quiz.explanation}
            </p>
          </div>
        )}

        {/* 제출/다음 버튼 */}
        <button
          onClick={isSubmitted ? handleNext : handleSubmit}
          className={`w-full h-[56px] mt-8 mb-4 rounded-[15px] text-white text-[17px] font-bold transition-all active:scale-95
          ${selectedIdx !== null ? "bg-[#0064FF] shadow-lg shadow-blue-200 cursor-pointer" : "bg-gray-300 cursor-not-allowed"}
          `}
          disabled={selectedIdx === null}
        >
          {isSubmitted ? "다음 문제 도전하기" : "제출하기"}
        </button>
      </div>
      <div className="h-[80px] bg-[#F2F2F6] shrink-0" /> 
    </div>
  );
};