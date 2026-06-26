import { useEffect, useState } from "react"
import { api, clearToken } from "../api"
import SiloCard from "./SiloCard"
import ProjectionChart from "./ProjectionChart"

export default function Dashboard({ user, onLogout }) {
  const [fincas, setFincas] = useState([])
  const [fincaId, setFincaId] = useState(null)
  const [silos, setSilos] = useState([])
  const [selectedSiloId, setSelectedSiloId] = useState(null)
  const [proyeccion, setProyeccion] = useState(null)
  const [lecturas, setLecturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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
    if (fincaId === null) return
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
          <button onClick={() => { clearToken(); onLogout() }} className="text-xs text-blue-200 hover:text-white">
            Salir
          </button>
        </div>
      </header>

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

        {loading ? (
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
