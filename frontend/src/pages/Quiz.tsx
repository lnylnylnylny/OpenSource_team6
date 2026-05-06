import { useState } from "react";
import axios from "axios";
import { NavBar } from "../components/NavBar";
import { QuizCard } from "../components/QuizCard";

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
      // 태하님의 백엔드 API 호출 (feat/quiz 브랜치 로직)
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
      <main className="flex-1 w-full max-w-[393px] pb-20"> {/* NavBar 높이만큼 패딩 */}
        {quiz ? (
          /* 퀴즈가 로드되었을 때 */
          <QuizCard 
            quiz={quiz} 
            onNext={() => setQuiz(null)} // 다시 난이도 선택으로 돌아가기
          />
        ) : (
          /* 난이도 선택 화면 (환영 메시지 포함) */
          <div className="p-6 pt-20">
            <div className="bg-white rounded-[25px] p-8 shadow-sm text-center">
              <h1 className="text-[22px] font-bold mb-2">경제 퀴즈에 오신 걸 환영해요! 💰</h1>
              <p className="text-gray-500 text-[15px] mb-8">
                문제를 맞히면 투자에 필요한<br />리워드를 받을 수 있어요.
              </p>
              
              <div className="flex flex-col gap-3">
                {['하', '중', '상'].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleStartQuiz(level)}
                    disabled={loading}
                    className="h-[60px] bg-[#F2F2F6] hover:bg-[#e5e5ea] active:scale-95 transition-all rounded-[15px] font-semibold text-[17px]"
                  >
                    {level} 난이도 {loading ? '...' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* 하단 네비게이션 바 */}
      <NavBar />
    </div>
  );
};