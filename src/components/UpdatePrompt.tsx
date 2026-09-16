import { useRegisterSW } from "virtual:pwa-register/react"

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (needRefresh) {
    return (
      <div className="fixed bottom-16 left-0 right-0 mx-4 z-50 bg-zinc-900 border border-zinc-700 rounded-xl p-3 flex items-center justify-between">
        <span className="text-sm text-white">
          Update available — restart to get the latest version.
        </span>
        <button
          onClick={() => updateServiceWorker(true)}
          className="ml-3 rounded-lg bg-white text-black text-sm font-medium px-3 py-1.5"
        >
          Update
        </button>
      </div>
    )
  }

  return null
}
