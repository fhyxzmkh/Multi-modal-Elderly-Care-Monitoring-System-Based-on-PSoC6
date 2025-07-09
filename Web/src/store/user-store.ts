import { create } from "zustand/react";

interface UserInfo {
  id: string;
  username: string;
}

interface UserStore {
  userInfo: UserInfo | null;

  setUserInfo: (userInfo: UserInfo) => void;
}

export const useUserStore = create<UserStore>()((set) => ({
  userInfo: null,

  setUserInfo: (userInfo: UserInfo) => set({ userInfo }),
}));
