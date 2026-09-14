import { create } from "zustand"
import { format } from "date-fns"

export type MetricType = "weight" | "sleep" | "steps" | "water" | "heartRate" | "temperature"

interface AppStore {
  currentDate: string
  selectedMetric: MetricType | null
  darkMode: boolean
  setCurrentDate: (date: string) => void
  setSelectedMetric: (metric: MetricType | null) => void
  toggleDarkMode: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  currentDate: format(new Date(), "yyyy-MM-dd"),
  selectedMetric: null,
  darkMode: localStorage.getItem("myhealth-darkmode") === "true",
  setCurrentDate: (date) => set({ currentDate: date }),
  setSelectedMetric: (metric) => set({ selectedMetric: metric }),
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode
      localStorage.setItem("myhealth-darkmode", String(next))
      document.documentElement.classList.toggle("dark", next)
      return { darkMode: next }
    }),
}))
