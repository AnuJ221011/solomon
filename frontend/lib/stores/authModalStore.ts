import { create } from "zustand";

type AuthMode = "login" | "signup";

interface AuthModalStore {
  open: boolean;
  mode: AuthMode;
  /** Action to replay after successful auth (e.g. add to cart) */
  pendingAction: (() => Promise<void>) | null;
  /** Message shown at the top of the modal */
  reason: string | null;

  openModal: (mode?: AuthMode, reason?: string, pendingAction?: () => Promise<void>) => void;
  closeModal: () => void;
  setMode: (mode: AuthMode) => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  open: false,
  mode: "signup",
  pendingAction: null,
  reason: null,

  openModal: (mode = "signup", reason = null, pendingAction = null) =>
    set({ open: true, mode, reason, pendingAction }),

  closeModal: () =>
    set({ open: false, pendingAction: null, reason: null }),

  setMode: (mode) => set({ mode }),
}));
