import { useEffect } from "react";
import { useNavigate } from "react-router";
import { kakaoLogin } from "../api/authApi";
import { useAuthStore } from "../store/authStore";
import { FloatingRocket } from "../components/FloatingRocket";

export const KakaoCallback = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const handleKakaoCallback = async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) {
        alert("로그인 실패: code 없음");
        navigate("/");
        return;
      }
      try {
        const data = await kakaoLogin(code);
        localStorage.setItem("accessToken", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        navigate("/home");
      } catch {
        alert("로그인에 실패했어요. 다시 시도해주세요.");
        navigate("/");
      }
    };
    handleKakaoCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative">
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40%            { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>

      <div className="z-10">
        <FloatingRocket floating={true} logoVisible={true} />
      </div>

      {/* 로딩 점 */}
      <div className="flex items-center gap-2 mt-10">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#2563EB",
              animation: `dotBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
