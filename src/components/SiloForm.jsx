import { useState } from "react"
import { api } from "../api"

export default function SiloForm({ silo, onCerrar, onGuardado }) {
  const [nombre, setNombre] = useState(silo.nombre)
  const [leadTime, setLeadTime] = useState(silo.lead_time_dias ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.actualizarSilo(silo.id, {
        nombre,
        lead_time_dias: leadTime === "" ? null : Number(leadTime),
      })
      onGuardado()
      onCerrar()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
        <h3 className="text-base font-medium mb-4">Editar {silo.codigo}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-granjazul-blue"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Lead time del molino (días)
            </label>
            <input
              type="number"
              min="0"
              value={leadTime}
              onChange={(e) => setLeadTime(e.target.value)}
              placeholder="ej. 3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-granjazul-blue"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Días que necesita el molino para producir y entregar un lote nuevo.
              Se usa para sugerir órdenes de producción automáticamente.
            </p>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white bg-granjazul-blue rounded-lg disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
