import { useState } from "react"
import Sidebar from "./Sidebar"
import NivelesView from "./NivelesView"
import BitacoraView from "./BitacoraView"
import AdminUsuarios from "./AdminUsuarios"

export default function Dashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState("dashboard")

  function renderPage() {
    switch (activePage) {
      case "dashboard": return <NivelesView user={user} />
      case "bitacora": return <BitacoraView />
      case "admin": return <AdminUsuarios onCerrar={() => setActivePage("dashboard")} />
      default: return <NivelesView user={user} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        user={user}
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={onLogout}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}
