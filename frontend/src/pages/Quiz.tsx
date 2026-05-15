import { useState } from "react";
import axios from "axios";
import { NavBar } from "../components/NavBar";
import { QuizCard } from "../components/QuizCard";

/* [추가] 로컬 에셋 이미지 불러오기 */
import SmartHamster from "../assets/images/smart_hamster.jpg";

// 백엔드 데이터 규격 정의
interface QuizData {
  id: number;
  question: string;
  options: string;
  answer: number;
  explanation: string;
  difficulty: string;
}

export const Quiz = () => {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);

  // 난이도 선택 시 호출되는 함수
  const handleStartQuiz = async (difficulty: string) => {
    setLoading(true);
    try {
      // 백엔드 API 호출 (로컬 서버 주소)
      const response = await axios.get(`http://localhost:8000/api/quizzes/random`, {
        params: { difficulty }
      });
      setQuiz(response.data);
    } catch (error) {
      console.error("퀴즈 로딩 실패:", error);
      alert("문제를 불러오지 못했습니다. 서버 상태를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F6] flex flex-col items-center">
      <main className="flex-1 w-full max-w-[393px] pb-20">
        {quiz ? (
          /* 퀴즈가 로드되었을 때 (QuizCard 컴포넌트) */
          <QuizCard 
            quiz={quiz} 
            onNext={() => setQuiz(null)}
          />
        ) : (
          /* 난이도 선택 화면 (환영 메시지 포함) */
          <div className="p-6 pt-20">
            <div className="bg-white rounded-[25px] p-8 shadow-sm text-center flex flex-col items-center">
              
              {/* [수정] 똑똑한 햄스터 이미지 적용 영역 */}
              <div className="w-28 h-28 mb-6 flex items-center justify-center bg-blue-50 rounded-full shrink-0 overflow-hidden">
                <img 
                  src={SmartHamster} 
                  alt="똑똑한 햄스터" 
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* 문구 잘림 방지 및 텍스트 덩어리 유지 */}
              <h1 className="text-[21px] font-bold mb-2 break-keep leading-tight">
                금융 퀴즈에 오신 걸 <span className="inline-block">환영해요! 💰</span>
              </h1>
              
              <p className="text-gray-500 text-[15px] mb-8 break-keep">
                문제를 맞히면 투자에 필요한<br />리워드를 받을 수 있어요.
              </p>
              
              <div className="flex flex-col gap-3 w-full">
                {['하', '중', '상'].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleStartQuiz(level)}
                    disabled={loading}
                    className={`h-[60px] bg-[#F2F2F6] hover:bg-[#e5e5ea] active:scale-95 transition-all rounded-[15px] font-semibold text-[17px] 
                    ${loading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
                    `}
                  >
                    난이도 {level} {loading ? '...' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};