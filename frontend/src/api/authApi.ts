import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    nickname: string;
    email: string | null;
    profile_image: string | null;
  };
}

export const kakaoLogin = async (code: string): Promise<AuthResponse> => {
  const response = await axios.get<AuthResponse>(`${BASE_URL}/auth/kakao`, {
    params: { code },
  });
  return response.data;
};
