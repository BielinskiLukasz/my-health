import { HashRouter, Routes, Route } from "react-router-dom"
import { useEffect } from "react"
import { Toaster } from "sonner"
import Layout from "./components/Layout"
import Dashboard from "./components/Dashboard/Dashboard"
import LogScreen from "./components/Log/LogScreen"
import Settings from "./components/Settings/Settings"
import MetricChart from "./components/Charts/MetricChart"
import UpdatePrompt from "./components/UpdatePrompt"
import { requestPersistentStorage } from "./utils/storage"

export default function App() {
  useEffect(() => {
    requestPersistentStorage()
    // Restore dark mode class on mount to avoid flash of wrong theme
    if (localStorage.getItem("myhealth-darkmode") === "true") {
      document.documentElement.classList.add("dark")
    }
  }, [])

  return (
    <HashRouter>
      <Toaster position="top-center" />
      <UpdatePrompt />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/log" element={<LogScreen />} />
          <Route path="/log/:metric" element={<LogScreen />} />
          <Route path="/chart/:metric" element={<MetricChart />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
