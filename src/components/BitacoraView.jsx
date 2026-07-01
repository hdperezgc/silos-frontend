import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, Filter, RefreshCw } from "lucide-react"
import { api } from "../api"

const TIPO_CONFIG = {
  descarga: {
    label: "Descarga",
    icon: ArrowDown,
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    iconColor: "text-orange-500",
  },
  llenado: {
    label: "Llenado",
    icon: ArrowUp,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    iconColor: "text-blue-500",
  },
}

function formatFecha(iso) {
  const d = new Date(iso)
  return d.toLocaleString("es-GT", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function BitacoraView() {
  const [fincas, setFincas] = useState([])
  const [silos, setSilos] = useState([])
  const [fincaId, setFincaId] = useState("")
  const [siloId, setSiloId] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [umbral, setUmbral] = useState(3)
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [buscado, setBuscado] = useState(false)

  useEffect(() => {
    api.fincas().then(setFincas).catch(() => {})
  }, [])

  useEffect(() => {
    if (!fincaId) { setSilos([]); setSiloId(""); return }
    api.silos(Number(fincaId)).then(setSilos).catch(() => {})
    setSiloId("")
  }, [fincaId])

  async function buscar() {
    setLoading(true)
    setError("")
    setBuscado(true)
    try {
      const params = new URLSearchParams()
      if (fincaId) params.set("finca_id", fincaId)
      if (siloId) params.set("silo_id", siloId)
      if (desde) params.set("desde", new Date(desde).toISOString())
      if (hasta) params.set("hasta", new Date(hasta + "T23:59:59").toISOString())
      params.set("umbral_descarga", umbral)
      const data = await api.bitacora(`?${params.toString()}`)
      setEventos(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const descargas = eventos.filter(e => e.tipo === "descarga").length
  const llenados = eventos.filter(e => e.tipo === "llenado").length

  return (
    <div className="py-8 px-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium">Bitácora</h2>
          <p className="text-sm text-gray-500">Eventos significativos de nivel por silo</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-gray-400" />
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Filtros</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Finca</label>
            <select value={fincaId} onChange={e => setFincaId(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm">
              <option value="">Todas</option>
              {fincas.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Silo</label>
            <select value={siloId} onChange={e => setSiloId(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
              disabled={!fincaId}>
              <option value="">Todos</option>
              {silos.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Umbral mínimo (%)</label>
            <input type="number" min="0.5" max="50" step="0.5" value={umbral}
              onChange={e => setUmbral(Number(e.target.value))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
        <button onClick={buscar} disabled={loading}
          className="flex items-center gap-2 bg-granjazul-blue text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Buscando..." : "Buscar eventos"}
        </button>
      </div>

      {/* Resultados */}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {buscado && !loading && (
        <>
          {/* Resumen */}
          {eventos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-2xl font-medium">{eventos.length}</p>
                <p className="text-xs text-gray-500 mt-1">eventos totales</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                <p className="text-2xl font-medium text-orange-700">{descargas}</p>
                <p className="text-xs text-orange-600 mt-1">descargas</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                <p className="text-2xl font-medium text-blue-700">{llenados}</p>
                <p className="text-xs text-blue-600 mt-1">llenados</p>
              </div>
            </div>
          )}

          {/* Tabla de eventos */}
          {eventos.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <p className="text-gray-500 font-medium">No se encontraron eventos</p>
              <p className="text-sm text-gray-400 mt-1">
                Probá ampliar el rango de fechas o reducir el umbral mínimo.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-4 py-3">Fecha y hora</th>
                    <th className="px-4 py-3">Silo</th>
                    <th className="px-4 py-3">Evento</th>
                    <th className="px-4 py-3 text-right">Antes</th>
                    <th className="px-4 py-3 text-right">Después</th>
                    <th className="px-4 py-3 text-right">Variación</th>
                  </tr>
                </thead>
                <tbody>
                  {eventos.map((e, i) => {
                    const cfg = TIPO_CONFIG[e.tipo]
                    const Icon = cfg.icon
                    return (
                      <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatFecha(e.fecha)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{e.silo_nombre}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                            <Icon size={11} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {e.nivel_antes_pct}%
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {e.nivel_despues_pct}%
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-medium ${e.tipo === "descarga" ? "text-orange-600" : "text-blue-600"}`}>
                          {e.variacion_pct > 0 ? "+" : ""}{e.variacion_pct}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!buscado && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-sm">Seleccioná los filtros y presioná "Buscar eventos".</p>
        </div>
      )}
    </div>
  )
}
