import type { Column } from "@tanstack/react-table";
import { create } from "zustand";

interface FollowUpsState {
  columns: Column<any, unknown>[];
  setColumns: (columns?: Column<any, unknown>[]) => void;
}

export const useFollowUpsStore = create<FollowUpsState>()((set) => ({
  columns: [],
  setColumns: (columns) => set({ columns: columns || [] }),
}));
