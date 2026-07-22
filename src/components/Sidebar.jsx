import { useState } from "react"
import {
  LayoutDashboard,
  ClipboardList,
  ClipboardCheck,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react"
import { clearToken } from "../api"

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "bitacora", label: "Bitácora", icon: ClipboardList },
  { id: "ordenes", label: "Órdenes de producción", icon: ClipboardCheck },
]

const ADMIN_ITEMS = [
  { id: "admin", label: "Usuarios", icon: Users },
]

export default function Sidebar({ user, activePage, onNavigate, onLogout }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleNav(page) {
    onNavigate(page)
    setMobileOpen(false)
  }

  function handleLogout() {
    clearToken()
    onLogout()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center justify-center px-4 py-4 border-b border-white/10`}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <img src="/logo.png" alt="Granjazul" className="w-6 h-6 object-contain" />
          </div>
        ) : (
          <img src="/logo.png" alt="Granjazul" className="h-14 object-contain" />
        )}
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleNav(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activePage === id
                ? "bg-white/15 text-white"
                : "text-blue-200 hover:bg-white/10 hover:text-white"
            } ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? label : ""}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
            {!collapsed && activePage === id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-granjazul-orange" />
            )}
          </button>
        ))}

        {/* Sección admin */}
        {user?.rol === "admin" && (
          <>
            {!collapsed && (
              <p className="text-[10px] text-blue-400 uppercase tracking-widest px-3 pt-4 pb-1">
                Administración
              </p>
            )}
            {collapsed && <div className="border-t border-white/10 my-2" />}
            {ADMIN_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activePage === id
                    ? "bg-white/15 text-white"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? label : ""}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
                {!collapsed && activePage === id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-granjazul-orange" />
                )}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Usuario + logout */}
      <div className="border-t border-white/10 px-2 py-3">
        <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-granjazul-orange/80 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.nombre?.charAt(0)?.toUpperCase() ?? "U"}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.nombre}</p>
              <p className="text-blue-300 text-[10px] truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 text-sm transition-all mt-1 ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Cerrar sesión" : ""}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>

      {/* Toggle colapso (solo desktop) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center absolute -right-3 top-16 w-6 h-6 bg-granjazul-blue border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile: botón hamburguesa */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-granjazul-blue rounded-lg flex items-center justify-center text-white shadow-lg"
      >
        <Menu size={18} />
      </button>

      {/* Mobile: overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile: drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-granjazul-blue z-50 transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-blue-300 hover:text-white"
        >
          <X size={18} />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop: sidebar fijo */}
      <div
        className={`hidden lg:block relative flex-shrink-0 bg-granjazul-blue h-screen transition-all duration-200 ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        <SidebarContent />
      </div>
    </>
  )
}
