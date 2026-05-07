import { QuizCard } from "../components/QuizCard"; 

export const Quiz = () => {
  return (
    <div className="min-h-screen bg-[#F2F2F6] flex flex-col items-center">
      <main className="flex-1 w-full max-w-[393px]">
        {/* 퀴즈 카드 띄우기 */}
        <QuizCard />
      </main>
    </div>
  );
};