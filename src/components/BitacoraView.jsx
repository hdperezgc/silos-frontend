import { ClipboardList } from "lucide-react"

export default function BitacoraView() {
  return (
    <div className="py-8 px-6">
      <h2 className="text-lg font-medium mb-1">Bitácora</h2>
      <p className="text-sm text-gray-500 mb-8">Historial de eventos y variaciones por silo</p>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <ClipboardList size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium mb-1">Módulo en construcción</p>
        <p className="text-sm text-gray-400 max-w-xs">
          Próximamente: historial de descargas, variaciones significativas de nivel y descarte de lecturas con ruido.
        </p>
      </div>
    </div>
  )
}
