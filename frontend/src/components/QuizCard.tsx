import React, { useState } from 'react';

export const QuizCard = () => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const quizData = {
    question: "주식시장에서 흔히 말하는 우량주(Blue Chip)의 특징으로 가장 알맞은 것은?",
    options: [
      "재무구조가 탄탄하고 장기간 안정적인 실적을 내는 주식",
      "단기간에 큰 수익을 노리는 주식",
      "가격 변동이 매우 심한 주식",
      "상장된 지 1년 이하의 신생 기업 주식"
    ],
    answer: 0
  };

  return (
    <div className="flex flex-col w-full max-w-[393px] min-h-screen bg-white mx-auto relative overflow-hidden">
      {/* 상단 파란색 영역 */}
      <div className="bg-[#3182F7] w-full h-[381px] p-6 pt-20">
        <button className="mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-white text-[24px] font-medium leading-[30px] break-keep">
          {quizData.question}
        </h2>
        {/* 캐릭터 이미지가 들어갈 자리 (image 7 반영) */}
        <div className="absolute right-4 top-[192px] w-[176px] h-[176px] bg-blue-400/20 rounded-full flex items-center justify-center text-white text-xs">
          이미지 영역
        </div>
      </div>

      {/* 선택지 영역 */}
      <div className="flex-1 bg-[#F2F2F6] rounded-t-[30px] -mt-10 p-5 pb-32">
        <div className="grid grid-cols-2 gap-4 mt-4">
          {quizData.options.map((option, i) => (
            <button
              key={i}
              onClick={() => setSelectedIdx(i)}
              className={`h-[106px] p-4 flex items-center justify-center text-center text-[15px] leading-[20px] rounded-[10px] bg-white transition-all ${
                selectedIdx === i 
                  ? "border-2 border-[#0064FF] text-[#0064FF] font-semibold" 
                  : "border border-[#D1D6DA] text-black"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {/* 제출하기 버튼 */}
        <button 
          className={`w-full h-[58px] mt-8 rounded-[10px] text-white text-[20px] font-medium transition-all ${
            selectedIdx !== null ? "bg-[#0064FF]" : "bg-gray-300"
          }`}
          disabled={selectedIdx === null}
        >
          제출하기
        </button>
      </div>
    </div>
  );
};