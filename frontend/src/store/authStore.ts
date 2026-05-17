import { create } from "zustand";

interface User {
  id: number;
  nickname: string;
  email: string | null;
  profile_image: string | null;
}

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  updateUser: (partial: Partial<User>) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // 앱 새로고침 시 localStorage에서 복원
  user: (() => {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  })(),

  setUser: (user) => set({ user }),

  clearUser: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    set({ user: null });
  },

  updateUser: (partial) =>
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...partial };
      localStorage.setItem("user", JSON.stringify(updated));
      return { user: updated };
    }),
}));
