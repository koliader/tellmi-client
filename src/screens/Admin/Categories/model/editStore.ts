import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ICategoryEditStore {
  /** Id of the category row currently being edited (null when inactive). */
  editingId: number | null;
  /** Current value of the inline name input. */
  draftName: string;
  startEditing: (id: number, name: string) => void;
  setDraftName: (draftName: string) => void;
  stopEditing: () => void;
}

export const categoryEditStore = create<ICategoryEditStore>()(
  immer((set) => ({
    editingId: null,
    draftName: "",
    startEditing: (id: number, name: string) =>
      set((state) => {
        state.editingId = id;
        state.draftName = name;
      }),
    setDraftName: (draftName: string) =>
      set((state) => {
        state.draftName = draftName;
      }),
    stopEditing: () =>
      set((state) => {
        state.editingId = null;
        state.draftName = "";
      }),
  })),
);