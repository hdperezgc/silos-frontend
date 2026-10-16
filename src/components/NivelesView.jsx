import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { api } from "../api"
import SiloCard from "./SiloCard"
import SiloForm from "./SiloForm"
import ProjectionChart from "./ProjectionChart"

// Cada cuánto se vuelve a pedir la información al backend. Los sensores
// reportan cada pocos minutos, así que un minuto mantiene el desfase corto
// sin saturar la API.
const REFRESCO_MS = 60000

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
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const [refrescando, setRefrescando] = useState(false)

  useEffect(() => {
    api.fincas()
      .then((data) => {
        setFincas(data)
        if (data.length > 0) setFincaId(data[0].id)
      })
      .catch((e) => setError(e.message))
  }, [])

  // Consulta cuáles silos ya tienen alguna orden abierta para marcarlos. Si
  // falla, se conserva lo que ya se mostraba en vez de borrar las marcas.
  const cargarSilosConOrden = useCallback(() => {
    return Promise.all([
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
      .catch(() => {})
  }, [])

  // Al abrir el dashboard se pide al backend que revise todos los silos y
  // genere sugerencias de orden de producción si corresponde. Solo se hace
  // una vez: generar órdenes tiene efectos, no debe repetirse en cada refresco.
  useEffect(() => {
    api.evaluarOrdenes().catch(() => {})
    cargarSilosConOrden()
  }, [cargarSilosConOrden])

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
        setUltimaActualizacion(new Date())
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [fincaId])

  useEffect(() => {
    if (selectedSiloId === null) return
    api.proyeccion(selectedSiloId).then(setProyeccion).catch(() => setProyeccion(null))
    api.lecturas(selectedSiloId, "?limite=200").then(setLecturas).catch(() => setLecturas([]))
  }, [selectedSiloId])

  // Refresco silencioso: no muestra "Cargando" ni cambia el silo seleccionado.
  // Si una petición falla se conserva lo que ya estaba en pantalla.
  const refrescar = useCallback(async () => {
    setRefrescando(true)
    const tareas = [cargarSilosConOrden()]
    if (fincaId !== null) {
      tareas.push(
        api.silos(fincaId)
          .then((lista) => Promise.all(lista.map((s) => api.silo(s.id))))
          .then(setSilos)
      )
    }
    if (selectedSiloId !== null) {
      tareas.push(api.proyeccion(selectedSiloId).then(setProyeccion))
      tareas.push(api.lecturas(selectedSiloId, "?limite=200").then(setLecturas))
    }
    await Promise.allSettled(tareas)
    setUltimaActualizacion(new Date())
    setRefrescando(false)
  }, [fincaId, selectedSiloId, cargarSilosConOrden])

  // Refresco automático. Se pausa con la pestaña en segundo plano y se
  // actualiza de inmediato cuando vuelve a estar visible.
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) refrescar()
    }, REFRESCO_MS)
    function alVolver() {
      if (!document.hidden) refrescar()
    }
    document.addEventListener("visibilitychange", alVolver)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", alVolver)
    }
  }, [refrescar])

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
        <div className="flex items-center gap-3">
          {ultimaActualizacion && (
            <span className="text-xs text-gray-400">
              Actualizado {ultimaActualizacion.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={refrescar}
            disabled={refrescando}
            title="Actualizar ahora"
            className="text-gray-400 hover:text-granjazul-blue disabled:opacity-50"
          >
            <RefreshCw size={14} className={refrescando ? "animate-spin" : ""} />
          </button>
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
