import { useState } from "react"
import { useAppStore } from "@/store/appStore"

export default function Settings() {
  // Dark mode state from Zustand — toggleDarkMode syncs Zustand, localStorage, and DOM class
  const darkMode = useAppStore((s) => s.darkMode)
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode)

  // Height state — read from localStorage key 'myhealth-height' on mount (UX-04)
  const [height, setHeight] = useState<string>(
    () => localStorage.getItem("myhealth-height") ?? ""
  )

  // Auto-save height to localStorage on every change (no save button needed)
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setHeight(val)
    localStorage.setItem("myhealth-height", val)
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold mb-6">Settings</h1>

      {/* Appearance section */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">
          Appearance
        </p>
        <div className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3">
          <span className="text-sm text-white">Dark Mode</span>
          {/*
            Toggle button: calls toggleDarkMode() which updates all three in sync:
            1. Zustand darkMode state
            2. localStorage key 'myhealth-darkmode'
            3. document.documentElement classList 'dark'
            Per UX-02 — dark mode preference persists across page reload
          */}
          <button
            type="button"
            role="switch"
            aria-checked={darkMode}
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${
              darkMode ? "bg-white" : "bg-zinc-700"
            }`}
          >
            <span className="sr-only">Toggle dark mode</span>
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform duration-200 ${
                darkMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="border-t border-zinc-800 mb-6" />

      {/* Body Measurements section */}
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">
          Body Measurements
        </p>
        <div className="rounded-xl bg-zinc-900 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-sm text-white">Height</span>
              <span className="text-xs text-gray-500">
                (cm, for BMI calculation in Phase 2)
              </span>
            </div>
            {/* Numeric input — auto-saves to localStorage key 'myhealth-height' on change */}
            <input
              type="number"
              min="100"
              max="250"
              step="1"
              value={height}
              onChange={handleHeightChange}
              placeholder="e.g. 178"
              className="w-20 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-white text-sm text-right placeholder:text-gray-600"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
