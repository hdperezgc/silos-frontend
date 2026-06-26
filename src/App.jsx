import { useEffect, useState } from "react"
import { api } from "./api"
import Login from "./components/Login"
import Dashboard from "./components/Dashboard"

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  function checkSession() {
    setChecking(true)
    api
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false))
  }

  useEffect(checkSession, [])

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Cargando...</div>
  }

  if (!user) {
    return <Login onLogin={checkSession} />
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />
}
