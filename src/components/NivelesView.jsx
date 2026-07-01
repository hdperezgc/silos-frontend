import { useEffect, useState } from "react"
import { api } from "../api"
import SiloCard from "./SiloCard"
import ProjectionChart from "./ProjectionChart"

export default function NivelesView({ user }) {
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

  useEffect(() => {
    api.fincas()
      .then((data) => {
        setFincas(data)
        if (data.length > 0) setFincaId(data[0].id)
      })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (fincaId === null) { setLoading(false); return }
    setLoading(true)
    api.silos(fincaId)
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
    api.lecturas(selectedSiloId, "?limite=200").then(setLecturas).catch(() => setLecturas([]))
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
    <div className="py-8 px-6">
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Sección niveles */}
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

      {/* Sección consumo y proyección */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium">Consumo y proyección</h2>
          <p className="text-sm text-gray-500">{siloSeleccionado?.nombre ?? "selecciona un silo"}</p>
        </div>
      </div>

      {/* Panel simulación (solo admin) */}
      {user?.rol === "admin" && siloSeleccionado && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-amber-800 mb-1">Generar datos simulados · {siloSeleccionado.nombre}</p>
          <p className="text-xs text-amber-700 mb-3">Reemplaza las lecturas actuales por una serie sintética de consumo.</p>
          <div className="flex flex-wrap items-end gap-3">
            {[
              { label: "% inicial", key: "porcentaje_inicial" },
              { label: "% final", key: "porcentaje_final" },
              { label: "días", key: "dias" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs text-gray-600 mb-1">{label}</label>
                <input
                  type="number"
                  min="0"
                  max={key === "dias" ? 90 : 100}
                  value={simForm[key]}
                  onChange={(e) => setSimForm({ ...simForm, [key]: Number(e.target.value) })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            ))}
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
              <p className="text-sm text-gray-500">consumo promedio: {proyeccion.consumo_diario_promedio_kg} kg/día</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">{proyeccion.mensaje}</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {siloSeleccionado
          ? <ProjectionChart lecturas={lecturas} silo={siloSeleccionado} />
          : <p className="text-sm text-gray-400 text-center py-12">Seleccioná un silo para ver la gráfica.</p>
        }
      </div>
    </div>
  )
}
