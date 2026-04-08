import { useEffect } from "react";
import { useNavigate } from "react-router";
import { kakaoLogin } from "../api/authApi";

export default function KakaoCallback() {
  const navigate = useNavigate();

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
        // JWT + 유저 정보 localStorage에 저장
        localStorage.setItem("accessToken", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/home");
        console.log("로그인 성공:", data);
      } catch {
        alert("로그인에 실패했어요. 다시 시도해주세요.");
        navigate("/");
      }
    };
    handleKakaoCallback();
  }, [navigate]);

  return (
    <p style={{ textAlign: "center", marginTop: "100px" }}>로그인 처리 중...</p>
  );
}
