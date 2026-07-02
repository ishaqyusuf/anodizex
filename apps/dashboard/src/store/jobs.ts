import type { Column } from "@tanstack/react-table";
import { create } from "zustand";

interface JobsState {
  columns: Column<any, unknown>[];
  setColumns: (columns?: Column<any, unknown>[]) => void;
}

export const useJobsStore = create<JobsState>()((set) => ({
  columns: [],
  setColumns: (columns) => set({ columns: columns || [] }),
}));
