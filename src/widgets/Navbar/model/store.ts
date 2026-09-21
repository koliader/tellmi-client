import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface IAlertDialogStore {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const alertDialogStore = create<IAlertDialogStore>()(
  immer((set) => ({
    isOpen: false,
    setIsOpen: (isOpen: boolean) =>
      set((state) => {
        state.isOpen = isOpen;
      }),
  })),
);
