import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ICategoryCreationStore {
  isReload: boolean;
  setIsReload: (isReload: boolean) => void;
}

export const categoryCreationStore = create<ICategoryCreationStore>()(
  immer((set) => ({
    isReload: false,
    setIsReload: (isReload: boolean) =>
      set((state) => {
        state.isReload = isReload;
      }),
  })),
);
