import { rocket, kakao } from "../assets";

const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_REST_API_KEY;
const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

const KAKAO_AUTH_URL =
  `https://kauth.kakao.com/oauth/authorize` +
  `?client_id=${KAKAO_CLIENT_ID}` +
  `&redirect_uri=${REDIRECT_URI}` +
  `&response_type=code`;

export default function LoginPage() {
  const handleKakaoLogin = () => {
    window.location.href = KAKAO_AUTH_URL;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-7 pt-15 pb-12">
      <div className="flex-1 flex flex-col items-center justify-center gap-10">
        <img src={rocket} alt="로켓 이미지" className="w-70" />

        <div className="text-center leading-relaxed ">
          <p className="text-xl font-semibold text-blue-600 p-2">
            매일 한 문제, 주식 감각 ON
          </p>
          <p className="text-xl font-semibold text-blue-600">
            실전 투자 연습까지 한 번에
          </p>
        </div>
      </div>

      <div className="w-full">
        <button
          onClick={handleKakaoLogin}
          className="w-full bg-[#FEE500] cursor-pointer rounded-xl py-4 text-[17px] font-bold text-[#3C1E1E] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <img src={kakao} alt="카카오 아이콘" className="w-6 h-6" />
          카카오 로그인
        </button>
      </div>
    </div>
  );
}
