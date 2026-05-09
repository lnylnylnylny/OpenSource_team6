const WEEK_DAYS = ["월", "화", "수", "목", "금", "토", "일"];

interface AttendanceStreakProps {
  streakDays: number;
  thisWeek: boolean[];
  todayIndex: number;
}

const getBadge = (streakDays: number, thisWeek: boolean[]) => {
  if (thisWeek.every(Boolean)) return "이번 주 개근! 🏆";
  if (streakDays >= 30) return "30일 달성! 🔥";
  if (streakDays >= 7) return `${streakDays}일 스트릭 🎖️`;
  return `${streakDays}일째 도전 중`;
};

const getMessage = (streakDays: number, todayIndex: number) => {
  const daysLeft = 6 - todayIndex;
  if (streakDays === 0) return "🌱 오늘부터 스트릭을 시작해보세요!";
  if (daysLeft === 0) return "🎉 이번 주 마지막 날! 내일도 함께해요";
  return `🎯 ${daysLeft}일 더 출석하면 이번 주 개근!`;
};

export const Attendance = ({
  streakDays,
  thisWeek,
  todayIndex,
}: AttendanceStreakProps) => {
  return (
    <div>
      <div className="bg-white rounded-[18px] border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-[28px] font-extrabold text-gray-900">
              {streakDays}
            </span>
            <span className="text-[13px] text-gray-400 font-2xl">
              일 연속🔥
            </span>
          </div>
          <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-3 py-1 rounded-full">
            {getBadge(streakDays, thisWeek)}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEK_DAYS.map((day, i) => {
            const isToday = i === todayIndex;
            const isDone = thisWeek[i] && !isToday;
            const isFuture = i > todayIndex;

            let dotClass = "";
            if (isToday) dotClass = "bg-blue-600 ring-2 ring-blue-200";
            else if (isDone) dotClass = "bg-blue-600";
            else if (isFuture)
              dotClass = "bg-gray-50 border border-dashed border-gray-200";
            else dotClass = "bg-gray-200";

            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400 font-medium">
                  {day}
                </span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${dotClass}`}
                >
                  {(isDone || isToday) && (
                    <span className="text-white text-[11px]">✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 bg-blue-50 rounded-xl px-3 py-2.5 text-[12px] text-blue-700 font-medium">
          {getMessage(streakDays, todayIndex)}
        </div>
      </div>
    </div>
  );
};
