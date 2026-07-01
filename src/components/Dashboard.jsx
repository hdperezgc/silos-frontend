import { useEffect, useState } from "react"
import { api, clearToken } from "../api"
import SiloCard from "./SiloCard"
import ProjectionChart from "./ProjectionChart"
import AdminUsuarios from "./AdminUsuarios"

export default function Dashboard({ user, onLogout }) {
  const [fincas, setFincas] = useState([])
  const [fincaId, setFincaId] = useState(null)
  const [silos, setSilos] = useState([])
  const [selectedSiloId, setSelectedSiloId] = useState(null)
  const [proyeccion, setProyeccion] = useState(null)
  const [lecturas, setLecturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [simForm, setSimForm] = useState({ porcentaje_inicial: 90, porcentaje_final: 10, dias: 14 })
  const [simLoading, setSimLoading] = useState(false)
  const [simMensaje, setSimMensaje] = useState("")
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    api
      .fincas()
      .then((data) => {
        setFincas(data)
        if (data.length > 0) setFincaId(data[0].id)
      })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (fincaId === null) {
      setLoading(false)
      return
    }
    setLoading(true)
    api
      .silos(fincaId)
      .then(async (lista) => {
        const detalles = await Promise.all(lista.map((s) => api.silo(s.id)))
        setSilos(detalles)
        if (detalles.length > 0) setSelectedSiloId(detalles[0].id)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fincaId])

  useEffect(() => {
    if (selectedSiloId === null) return
    api.proyeccion(selectedSiloId).then(setProyeccion).catch(() => setProyeccion(null))
    api
      .lecturas(selectedSiloId, "?limite=200")
      .then(setLecturas)
      .catch(() => setLecturas([]))
  }, [selectedSiloId])

  const siloSeleccionado = silos.find((s) => s.id === selectedSiloId)

  function refrescarSiloSeleccionado() {
    if (selectedSiloId === null) return
    api.silo(selectedSiloId).then((detalle) => {
      setSilos((prev) => prev.map((s) => (s.id === detalle.id ? detalle : s)))
    })
    api.proyeccion(selectedSiloId).then(setProyeccion).catch(() => setProyeccion(null))
    api.lecturas(selectedSiloId, "?limite=200").then(setLecturas).catch(() => setLecturas([]))
  }

  async function handleSimular() {
    if (selectedSiloId === null) return
    setSimLoading(true)
    setSimMensaje("")
    try {
      const res = await api.simular(selectedSiloId, { ...simForm, borrar_anteriores: true })
      setSimMensaje(`Se generaron ${res.lecturas_insertadas} lecturas simuladas.`)
      refrescarSiloSeleccionado()
    } catch (e) {
      setSimMensaje(e.message)
    } finally {
      setSimLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-granjazul-blue px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-7 bg-granjazul-orange rounded" />
          <div>
            <p className="text-white font-medium text-sm leading-none">Granjazul</p>
            <p className="text-[11px] text-blue-200 leading-none mt-1">Monitoreo de silos</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-blue-200">{user?.email}</span>
          {user?.rol === "admin" && (
            <button
              onClick={() => setShowAdmin(true)}
              className="text-xs text-blue-200 hover:text-white border border-blue-400 px-2 py-1 rounded"
            >
              Usuarios
            </button>
          )}
          <button onClick={() => { clearToken(); onLogout() }} className="text-xs text-blue-200 hover:text-white">
            Salir
          </button>
        </div>
      </header>

      {showAdmin && <AdminUsuarios onCerrar={() => setShowAdmin(false)} />}

      <main className="max-w-5xl mx-auto px-6 py-8">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium">Niveles</h2>
            <p className="text-sm text-gray-500">silos por finca</p>
          </div>
          {fincas.length > 1 && (
            <select
              value={fincaId ?? ""}
              onChange={(e) => setFincaId(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              {fincas.map((f) => (
                <option key={f.id} value={f.id}>{f.nombre}</option>
              ))}
            </select>
          )}
        </div>

        {fincas.length === 0 ? (
          <p className="text-sm text-gray-400">No hay fincas registradas todavía.</p>
        ) : loading ? (
          <p className="text-sm text-gray-400">Cargando silos...</p>
        ) : silos.length === 0 ? (
          <p className="text-sm text-gray-400">No hay silos registrados en esta finca.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
            {silos.map((silo) => (
              <SiloCard
                key={silo.id}
                silo={silo}
                selected={silo.id === selectedSiloId}
                onSelect={setSelectedSiloId}
              />
            ))}
          </div>
        )}

        <div className="border-t border-gray-200 mb-6" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium">Consumo y proyección</h2>
            <p className="text-sm text-gray-500">{siloSeleccionado?.nombre ?? "selecciona un silo"}</p>
          </div>
        </div>

        {user?.rol === "admin" && siloSeleccionado && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium text-amber-800 mb-2">
              Generar datos simulados para {siloSeleccionado.nombre}
            </p>
            <p className="text-xs text-amber-700 mb-3">
              Reemplaza las lecturas actuales de este silo por una serie sintética. Útil mientras no hay sensores reales conectados.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">% inicial</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={simForm.porcentaje_inicial}
                  onChange={(e) => setSimForm({ ...simForm, porcentaje_inicial: Number(e.target.value) })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">% final</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={simForm.porcentaje_final}
                  onChange={(e) => setSimForm({ ...simForm, porcentaje_final: Number(e.target.value) })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">días</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={simForm.dias}
                  onChange={(e) => setSimForm({ ...simForm, dias: Number(e.target.value) })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <button
                onClick={handleSimular}
                disabled={simLoading}
                className="bg-granjazul-blue text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50"
              >
                {simLoading ? "Generando..." : "Generar"}
              </button>
            </div>
            {simMensaje && <p className="text-xs text-amber-700 mt-2">{simMensaje}</p>}
          </div>
        )}

        {proyeccion && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            {proyeccion.confiable ? (
              <>
                <p className="text-2xl font-medium">{proyeccion.dias_restantes} días restantes</p>
                <p className="text-sm text-gray-500">
                  consumo promedio: {proyeccion.consumo_diario_promedio_kg} kg/día
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">{proyeccion.mensaje}</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          {siloSeleccionado && <ProjectionChart lecturas={lecturas} silo={siloSeleccionado} />}
        </div>
      </main>
    </div>
  )
}
