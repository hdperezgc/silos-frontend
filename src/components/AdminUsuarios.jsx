import { useEffect, useState } from "react"
import { api } from "../api"

const ROLES = ["admin", "supervisor", "visor"]

const rolBadge = {
  admin: "bg-purple-100 text-purple-700",
  supervisor: "bg-blue-100 text-blue-700",
  visor: "bg-gray-100 text-gray-600",
}

function FormNuevoUsuario({ onCreado, onCancelar }) {
  const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "visor" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.adminCrearUsuario(form)
      onCreado()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-medium mb-4">Nuevo usuario</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nombre completo</label>
          <input
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-granjazul-blue"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-granjazul-blue"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Contraseña (mínimo 8 caracteres)</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-granjazul-blue"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Rol</label>
          <select
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        {error && <p className="sm:col-span-2 text-xs text-red-600">{error}</p>}
        <div className="sm:col-span-2 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm text-white bg-granjazul-blue rounded-lg disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear usuario"}
          </button>
        </div>
      </form>
    </div>
  )
}

function FilaUsuario({ usuario, onActualizado }) {
  const [editRol, setEditRol] = useState(usuario.rol)
  const [loading, setLoading] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [nuevaPass, setNuevaPass] = useState("")
  const [resetMsg, setResetMsg] = useState("")

  async function handleRol(nuevoRol) {
    setEditRol(nuevoRol)
    setLoading(true)
    try {
      await api.adminActualizarUsuario(usuario.id, { rol: nuevoRol })
      onActualizado()
    } catch {
      setEditRol(usuario.rol)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActivo() {
    setLoading(true)
    try {
      await api.adminActualizarUsuario(usuario.id, { activo: !usuario.activo })
      onActualizado()
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setResetMsg("")
    setLoading(true)
    try {
      await api.adminResetPassword(usuario.id, nuevaPass)
      setResetMsg("Contraseña actualizada.")
      setNuevaPass("")
      setTimeout(() => { setShowReset(false); setResetMsg("") }, 1500)
    } catch (err) {
      setResetMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <tr className="border-t border-gray-100">
        <td className="py-3 pr-4">
          <p className="text-sm font-medium">{usuario.nombre}</p>
          <p className="text-xs text-gray-400">{usuario.email}</p>
        </td>
        <td className="py-3 pr-4">
          <select
            value={editRol}
            onChange={(e) => handleRol(e.target.value)}
            disabled={loading}
            className={`text-xs font-medium px-2 py-1 rounded border-0 ${rolBadge[editRol]}`}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </td>
        <td className="py-3 pr-4">
          <button
            onClick={handleToggleActivo}
            disabled={loading}
            className={`text-xs px-3 py-1 rounded-full font-medium ${
              usuario.activo
                ? "bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600"
                : "bg-red-100 text-red-600 hover:bg-green-50 hover:text-green-700"
            }`}
          >
            {usuario.activo ? "activo" : "inactivo"}
          </button>
        </td>
        <td className="py-3">
          <button
            onClick={() => { setShowReset(!showReset); setResetMsg(""); setNuevaPass("") }}
            className="text-xs text-gray-400 hover:text-granjazul-blue underline"
          >
            {showReset ? "cancelar" : "cambiar contraseña"}
          </button>
        </td>
      </tr>
      {showReset && (
        <tr className="bg-gray-50">
          <td colSpan={4} className="px-0 pb-3">
            <form onSubmit={handleReset} className="flex items-center gap-2 px-1">
              <input
                type="password"
                required
                minLength={8}
                placeholder="Nueva contraseña (mín. 8 caracteres)"
                value={nuevaPass}
                onChange={(e) => setNuevaPass(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-granjazul-blue"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-granjazul-blue text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </form>
            {resetMsg && (
              <p className={`text-xs mt-1 px-1 ${resetMsg.includes("actualizada") ? "text-green-600" : "text-red-600"}`}>
                {resetMsg}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default function AdminUsuarios({ onCerrar }) {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  function cargar() {
    setLoading(true)
    api.adminUsuarios()
      .then(setUsuarios)
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-medium">Administración de usuarios</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="overflow-y-auto px-6 py-4 flex-1">
          {mostrarForm ? (
            <FormNuevoUsuario
              onCreado={() => { setMostrarForm(false); cargar() }}
              onCancelar={() => setMostrarForm(false)}
            />
          ) : (
            <button
              onClick={() => setMostrarForm(true)}
              className="mb-4 text-sm text-white bg-granjazul-blue px-4 py-2 rounded-lg"
            >
              + Nuevo usuario
            </button>
          )}

          {loading ? (
            <p className="text-sm text-gray-400">Cargando usuarios...</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="pb-2 pr-4">Usuario</th>
                  <th className="pb-2 pr-4">Rol</th>
                  <th className="pb-2 pr-4">Estado</th>
                  <th className="pb-2">Contraseña</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <FilaUsuario key={u.id} usuario={u} onActualizado={cargar} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
