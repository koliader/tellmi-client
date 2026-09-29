import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ICategoryEditStore {
  /** Id of the category row currently being edited (null when inactive). */
  editingId: number | null;
  /** Current value of the inline name input. */
  draftName: string;
  /** Current value of the inline color picker. */
  draftColor: string;
  startEditing: (id: number, name: string, color: string) => void;
  setDraftName: (draftName: string) => void;
  setDraftColor: (draftColor: string) => void;
  stopEditing: () => void;
}

export const categoryEditStore = create<ICategoryEditStore>()(
  immer((set) => ({
    editingId: null,
    draftName: "",
    draftColor: "",
    startEditing: (id: number, name: string, color: string) =>
      set((state) => {
        state.editingId = id;
        state.draftName = name;
        state.draftColor = color;
      }),
    setDraftName: (draftName: string) =>
      set((state) => {
        state.draftName = draftName;
      }),
    setDraftColor: (draftColor: string) =>
      set((state) => {
        state.draftColor = draftColor;
      }),
    stopEditing: () =>
      set((state) => {
        state.editingId = null;
        state.draftName = "";
        state.draftColor = "";
      }),
  })),
);