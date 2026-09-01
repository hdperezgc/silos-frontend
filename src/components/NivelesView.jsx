import { useEffect, useState } from "react"
import { api } from "../api"
import SiloCard from "./SiloCard"
import SiloForm from "./SiloForm"
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
  const [silosConOrden, setSilosConOrden] = useState(new Set())
  const [siloEditando, setSiloEditando] = useState(null)

  useEffect(() => {
    api.fincas()
      .then((data) => {
        setFincas(data)
        if (data.length > 0) setFincaId(data[0].id)
      })
      .catch((e) => setError(e.message))
  }, [])

  // Al cargar el dashboard, se pide al backend que revise todos los silos y
  // genere sugerencias de orden de producción si corresponde, y luego se
  // consulta cuáles silos ya tienen alguna orden abierta para marcarlos.
  useEffect(() => {
    api.evaluarOrdenes().catch(() => {})
    cargarSilosConOrden()
  }, [])

  function cargarSilosConOrden() {
    Promise.all([
      api.ordenes("?estado=sugerida"),
      api.ordenes("?estado=confirmada"),
      api.ordenes("?estado=en_proceso"),
    ])
      .then(([sugeridas, confirmadas, enProceso]) => {
        const idsSet = new Set(
          [...sugeridas, ...confirmadas, ...enProceso].map((o) => o.silo_id)
        )
        setSilosConOrden(idsSet)
      })
      .catch(() => setSilosConOrden(new Set()))
  }

  useEffect(() => {
    if (fincaId === null) { setLoading(false); return }
    setLoading(true)
    api.silos(fincaId)
      .then(async (lista) => {
        const detalles = await Promise.all(lista.map((s) => api.silo(s.id)))
        setSilos(detalles)
    if (detalles.length > 0) {
      setSelectedSiloId(detalles[0].id)
    }
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
              ordenPendiente={silosConOrden.has(silo.id)}
              onEditar={user?.rol === "admin" ? setSiloEditando : undefined}
            />
          ))}
        </div>
      )}

      {siloEditando && (
        <SiloForm
          silo={siloEditando}
          onCerrar={() => setSiloEditando(null)}
          onGuardado={() => {
            api.silo(siloEditando.id).then((detalle) => {
              setSilos((prev) => prev.map((s) => (s.id === detalle.id ? detalle : s)))
            })
          }}
        />
      )}

      <div className="border-t border-gray-200 mb-6" />

      {/* Sección consumo y proyección */}
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
