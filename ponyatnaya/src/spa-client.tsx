"use client"

import dynamic from "next/dynamic"

// The ported Vite SPA relies on react-router's BrowserRouter and window APIs,
// so it must run client-side only.
const App = dynamic(() => import("./App"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Загрузка…
    </div>
  ),
})

export default function SpaClient() {
  return <App />
}
