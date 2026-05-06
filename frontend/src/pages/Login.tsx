import { useEffect, useState } from "react";
import { kakao } from "../assets";
import { FloatingRocket } from "../components/FloatingRocket";

const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_REST_API_KEY;
const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

const KAKAO_AUTH_URL =
  `https://kauth.kakao.com/oauth/authorize` +
  `?client_id=${KAKAO_CLIENT_ID}` +
  `&redirect_uri=${REDIRECT_URI}` +
  `&response_type=code`;

export const Login = () => {
  const [phase, setPhase] = useState<"idle" | "rise">("idle");

  useEffect(() => {
    const t = setTimeout(() => setPhase("rise"), 100);
    return () => clearTimeout(t);
  }, []);

  const handleKakaoLogin = () => {
    window.location.href = KAKAO_AUTH_URL;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative px-7">
      <div
        className="z-10"
        style={{
          transform:
            phase === "idle"
              ? "translateY(60px) scale(0.85)"
              : "translateY(0px) scale(1)",
          opacity: phase === "idle" ? 0 : 1,
          transition:
            "transform 0.8s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease",
        }}
      >
        <FloatingRocket
          floating={phase === "rise"}
          logoVisible={phase === "rise"}
        />
      </div>

      {/* 로그인 유도 문구 */}
      <div
        className="mt-10 text-center z-10 flex flex-col gap-1"
        style={{
          opacity: phase === "rise" ? 1 : 0,
          transform: phase === "rise" ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.6s 0.85s ease, transform 0.6s 0.85s ease",
        }}
      ></div>

      {/* 카카오 버튼 */}
      <div
        className="absolute bottom-12 left-7 right-7 z-10"
        style={{
          opacity: phase === "rise" ? 1 : 0,
          transform: phase === "rise" ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.6s 1.1s ease, transform 0.6s 1.1s ease",
        }}
      >
        <button
          onClick={handleKakaoLogin}
          className="w-full bg-[#FEE500] cursor-pointer rounded-xl py-4 text-[17px] font-bold text-[#3C1E1E] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <img src={kakao} alt="카카오 아이콘" className="w-6 h-6" />
          카카오로 시작하기
        </button>
        <p className="text-center text-[12px] text-gray-400 mt-3">
          로그인하고 나만의 포트폴리오를 시작해보세요!
        </p>
      </div>
    </div>
  );
};
