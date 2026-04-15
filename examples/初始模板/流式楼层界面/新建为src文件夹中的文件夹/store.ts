import { create } from 'zustand';

type DataStore = {
  data: string;
  setData: (data: string) => void;
};

export const useDataStore = create<DataStore>(set => ({
  data: '',
  setData: data => set({ data }),
}));
