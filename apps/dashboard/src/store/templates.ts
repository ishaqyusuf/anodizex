import type { Column } from "@tanstack/react-table";
import { create } from "zustand";

interface TemplatesState {
  columns: Column<any, unknown>[];
  setColumns: (columns?: Column<any, unknown>[]) => void;
}

export const useTemplatesStore = create<TemplatesState>()((set) => ({
  columns: [],
  setColumns: (columns) => set({ columns: columns || [] }),
}));
