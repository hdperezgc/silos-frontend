import { useEffect, useState } from "react"
import { RefreshCw, CheckCircle2 } from "lucide-react"
import { api } from "../api"

const ESTADO_CONFIG = {
  sugerida: { label: "Sugerida", bg: "bg-amber-50", text: "text-amber-700" },
  confirmada: { label: "Confirmada", bg: "bg-blue-50", text: "text-blue-700" },
  en_proceso: { label: "En proceso", bg: "bg-purple-50", text: "text-purple-700" },
  completada: { label: "Completada", bg: "bg-green-50", text: "text-green-700" },
  cancelada: { label: "Cancelada", bg: "bg-gray-100", text: "text-gray-500" },
}

const SIGUIENTE_ESTADO = {
  confirmada: "en_proceso",
  en_proceso: "completada",
}

function formatFecha(iso) {
  return new Date(iso).toLocaleString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function FilaOrden({ orden, silosPorId, onActualizada }) {
  const [cantidad, setCantidad] = useState(orden.cantidad_kg_sugerida)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const cfg = ESTADO_CONFIG[orden.estado]
  const silo = silosPorId[orden.silo_id]

  async function confirmar() {
    setLoading(true)
    setError("")
    try {
      await api.confirmarOrden(orden.id, { cantidad_kg_confirmada: Number(cantidad) })
      onActualizada()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function avanzarEstado() {
    const siguiente = SIGUIENTE_ESTADO[orden.estado]
    if (!siguiente) return
    setLoading(true)
    setError("")
    try {
      await api.actualizarEstadoOrden(orden.id, { estado: siguiente })
      onActualizada()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-3 text-sm font-medium">{silo?.nombre ?? `Silo #${orden.silo_id}`}</td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
          {cfg.label}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-right">
        {orden.estado === "sugerida" ? (
          <input
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
          />
        ) : (
          <span>{(orden.cantidad_kg_confirmada ?? orden.cantidad_kg_sugerida).toLocaleString()} kg</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
        {formatFecha(orden.fecha_necesaria)}
      </td>
      <td className="px-4 py-3 text-right">
        {orden.estado === "sugerida" && (
          <button
            onClick={confirmar}
            disabled={loading}
            className="inline-flex items-center gap-1 text-xs bg-granjazul-blue text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
          >
            <CheckCircle2 size={13} /> Confirmar
          </button>
        )}
        {SIGUIENTE_ESTADO[orden.estado] && (
          <button
            onClick={avanzarEstado}
            disabled={loading}
            className="text-xs text-granjazul-blue underline disabled:opacity-50"
          >
            Marcar {ESTADO_CONFIG[SIGUIENTE_ESTADO[orden.estado]].label.toLowerCase()}
          </button>
        )}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </td>
    </tr>
  )
}

export default function OrdenesProduccionView() {
  const [ordenes, setOrdenes] = useState([])
  const [silosPorId, setSilosPorId] = useState({})
  const [loading, setLoading] = useState(true)
  const [evaluando, setEvaluando] = useState(false)
  const [filtro, setFiltro] = useState("")

  async function cargarSilos() {
    try {
      const fincas = await api.fincas()
      const listas = await Promise.all(fincas.map((f) => api.silos(f.id)))
      const mapa = {}
      listas.flat().forEach((s) => { mapa[s.id] = s })
      setSilosPorId(mapa)
    } catch {
      setSilosPorId({})
    }
  }

  function cargarOrdenes() {
    setLoading(true)
    api
      .ordenes(filtro ? `?estado=${filtro}` : "")
      .then(setOrdenes)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargarSilos()
  }, [])

  useEffect(cargarOrdenes, [filtro])

  async function evaluarAhora() {
    setEvaluando(true)
    try {
      await api.evaluarOrdenes()
      cargarOrdenes()
    } finally {
      setEvaluando(false)
    }
  }

  return (
    <div className="py-8 px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium">Órdenes de producción</h2>
          <p className="text-sm text-gray-500">sugeridas según la proyección de consumo</p>
        </div>
        <button
          onClick={evaluarAhora}
          disabled={evaluando}
          className="flex items-center gap-2 text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={evaluando ? "animate-spin" : ""} />
          {evaluando ? "Revisando..." : "Revisar silos ahora"}
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "sugerida", "confirmada", "en_proceso", "completada", "cancelada"].map((e) => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              filtro === e ? "bg-granjazul-blue text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {e === "" ? "Todas" : ESTADO_CONFIG[e].label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Cargando órdenes...</p>
      ) : ordenes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500 font-medium">No hay órdenes en este filtro</p>
          <p className="text-sm text-gray-400 mt-1">
            Prueba "Revisar silos ahora" para generar sugerencias según el consumo actual.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-4 py-3">Silo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3">Fecha necesaria</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o) => (
                <FilaOrden key={o.id} orden={o} silosPorId={silosPorId} onActualizada={cargarOrdenes} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
