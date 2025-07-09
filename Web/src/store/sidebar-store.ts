import { create } from "zustand";
import { axios_login_instance } from "@/config/configuration.ts";

interface SidebarState {
  unconfirmed_message_count: number;

  isMobileOpen: boolean;

  setUnconfirmedMessageCount: (count: number) => void;

  getUnconfirmedMessagesCount: () => Promise<void>;

  toggleMobileOpen: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  unconfirmed_message_count: 0,

  isMobileOpen: false,

  setUnconfirmedMessageCount: (count) =>
    set({ unconfirmed_message_count: count }),

  getUnconfirmedMessagesCount: async () => {
    const response = await axios_login_instance.get(
      "/message/count/unconfirmed",
    );
    set({ unconfirmed_message_count: response.data.data });
  },

  toggleMobileOpen: () =>
    set((state) => ({ isMobileOpen: !state.isMobileOpen })),
}));
