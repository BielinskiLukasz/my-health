import { useLocation, useNavigate } from "react-router-dom"
import { Home, Plus, Settings } from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const isHome = location.pathname === "/"
  const isLog = location.pathname.startsWith("/log")
  const isSettings = location.pathname === "/settings"

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="pb-16">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 z-50">
        <div className="flex">
          <button
            onClick={() => navigate("/")}
            className={`flex flex-1 flex-col items-center justify-center py-3 gap-1 transition-colors ${
              isHome ? "text-white" : "text-gray-400"
            }`}
            aria-label="Home"
          >
            <Home
              className={`size-5 ${isHome ? "fill-white stroke-white" : ""}`}
            />
            <span className="text-xs">Home</span>
          </button>

          <button
            onClick={() => navigate("/log")}
            className={`flex flex-1 flex-col items-center justify-center py-3 gap-1 transition-colors ${
              isLog ? "text-white" : "text-gray-400"
            }`}
            aria-label="Log"
          >
            <Plus
              className={`size-5 ${isLog ? "stroke-white stroke-[2.5px]" : ""}`}
            />
            <span className="text-xs">Log</span>
          </button>

          <button
            onClick={() => navigate("/settings")}
            className={`flex flex-1 flex-col items-center justify-center py-3 gap-1 transition-colors ${
              isSettings ? "text-white" : "text-gray-400"
            }`}
            aria-label="Settings"
          >
            <Settings
              className={`size-5 ${isSettings ? "fill-white stroke-black" : ""}`}
            />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
