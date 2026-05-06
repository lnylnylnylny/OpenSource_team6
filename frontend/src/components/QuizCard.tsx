import React, { useState } from 'react';

interface QuizProps {
  quiz: {
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

  const optionsArray = quiz.options.split(',');

  const handleNext = () => {
    setIsSubmitted(false);
    setSelectedIdx(null);
    onNext();
  };

  return (
    <div className="flex flex-col w-full max-w-[393px] min-h-screen bg-white mx-auto relative overflow-hidden">
      {/* 상단 영역: 그림 영역을 삭제하고 텍스트 중앙 집중형으로 변경 */}
      <div className="bg-[#3182F7] w-full h-[320px] p-8 pt-20 transition-all flex flex-col justify-center">
        <button 
          className="absolute top-14 left-6 hover:opacity-70 transition-opacity" 
          onClick={() => onNext()}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        
        <div className="mb-4">
          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
            LEVEL: {quiz.difficulty}
          </span>
        </div>
        
        <h2 className="text-white text-[26px] font-semibold leading-[36px] break-keep">
          {quiz.question}
        </h2>
      </div>

      {/* 선택지 영역: 상단 카드와 겹치도록 -mt-10 유지 */}
      <div className="flex-1 bg-[#F2F2F6] rounded-t-[30px] -mt-10 p-5 pb-32 shadow-inner">
        <div className="grid grid-cols-2 gap-3 mt-4">
          {optionsArray.map((option, i) => (
            <button
              key={i}
              disabled={isSubmitted}
              onClick={() => setSelectedIdx(i)}
              className={`h-[110px] p-4 flex items-center justify-center text-center text-[15px] leading-[22px] rounded-[15px] transition-all duration-200 ${
                selectedIdx === i 
                  ? "border-2 border-[#0064FF] text-[#0064FF] font-bold bg-white shadow-md" 
                  : "border border-[#D1D6DA] text-black bg-white"
              } ${
                // 제출 후 정답 표시: 초록색 테두리
                isSubmitted && i === quiz.answer ? "border-2 border-green-500 bg-green-50" : ""
              } ${
                // 제출 후 내가 고른 답이 오답일 때: 빨간색 테두리
                isSubmitted && i === selectedIdx && i !== quiz.answer ? "border-2 border-red-500 bg-red-50" : ""
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {/* 결과 및 해설 박스: 애니메이션 효과 추가 */}
        {isSubmitted && (
          <div className="mt-6 p-5 bg-white rounded-[15px] border border-gray-100 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-lg font-bold ${selectedIdx === quiz.answer ? "text-green-600" : "text-red-600"}`}>
                {selectedIdx === quiz.answer ? "정답이에요! 🎉" : "아쉬워요.. 😢"}
              </span>
            </div>
            <p className="text-gray-600 text-[14px] leading-[20px] break-keep">
              {quiz.explanation}
            </p>
          </div>
        )}

        {/* 하단 버튼 고정 느낌을 위해 mt-8 */}
        <button 
          onClick={isSubmitted ? handleNext : () => setIsSubmitted(true)}
          className={`w-full h-[60px] mt-8 rounded-[15px] text-white text-[18px] font-bold transition-all active:scale-95 ${
            selectedIdx !== null ? "bg-[#0064FF] shadow-lg shadow-blue-200" : "bg-gray-300"
          }`}
          disabled={selectedIdx === null}
        >
          {isSubmitted ? "다음 문제 도전하기" : "제출하기"}
        </button>
      </div>
    </div>
  );
};