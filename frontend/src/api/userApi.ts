import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

export interface UpdateProfileRequest {
  nickname?: string;
  profile_image?: File | null;
}

export interface UpdateProfileResponse {
  id: number;
  nickname: string;
  email: string | null;
  profile_image: string | null;
}

export const updateProfile = async (
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  const formData = new FormData();
  if (data.nickname) formData.append("nickname", data.nickname);
  if (data.profile_image) formData.append("profile_image", data.profile_image);

  const token = localStorage.getItem("accessToken");
  const response = await axios.patch<UpdateProfileResponse>(
    `${BASE_URL}/users/me`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const deleteAccount = async (): Promise<void> => {
  const token = localStorage.getItem("accessToken");
  await axios.delete(`${BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const logout = (): void => {
  localStorage.removeItem("accessToken");
};
