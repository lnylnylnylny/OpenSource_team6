import { useEffect, useRef, useState } from "react";
import { camera, profile } from "../assets";
import { useAuthStore } from "../store/authStore";
import { updateProfile } from "../api/userApi";

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfile = ({ isOpen, onClose }: EditProfileProps) => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [nickname, setNickname] = useState(user?.nickname || "");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // 마운트/언마운트 제어
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
    } else {
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 애니메이션 + 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setNickname(user?.nickname || "");
      setPreviewImage(null);
      setImageFile(null);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, user]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      const updated = await updateProfile({
        nickname,
        profile_image: imageFile,
      });
      updateUser(updated);
      onClose();
    } catch (err) {
      console.error("프로필 수정 실패", err);
    }
  };

  const currentImage = previewImage || user?.profile_image || profile;
  const isChanged = nickname !== user?.nickname || previewImage !== null;

  if (!isMounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ${
        isAnimating ? "bg-black/40" : "bg-black/0"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className={`w-full max-w-120 bg-white rounded-t-2xl transition-transform duration-300 ease-out ${
          isAnimating ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          >
            취소
          </button>
          <p className="text-[15px] font-semibold text-gray-900">프로필 수정</p>
          <button
            onClick={handleSave}
            disabled={!isChanged}
            className={`text-sm font-semibold transition-colors ${
              isChanged
                ? "text-blue-500 hover:text-blue-600 cursor-pointer"
                : "text-gray-300 cursor-not-allowed"
            }`}
          >
            저장
          </button>
        </div>

        {/* 본문 */}
        <div className="px-5 pt-8 pb-10 flex flex-col items-center gap-8">
          {/* 프로필 이미지 */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm">
                <img
                  src={currentImage}
                  alt="프로필"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center shadow-md hover:bg-gray-700 active:scale-95 transition-all"
                aria-label="이미지 변경"
              >
                <img src={camera} alt="camera" />
              </button>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-500 font-medium hover:text-blue-600 transition-colors cursor-pointer"
            >
              사진 변경
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* 닉네임 입력 */}
          <div className="w-full flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500 px-1">
              닉네임
            </label>
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                placeholder="닉네임을 입력해주세요"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 border border-transparent focus:border-blue-400 focus:bg-white focus:outline-none transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300">
                {nickname.length}/20
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
