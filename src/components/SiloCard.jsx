import { Pencil } from "lucide-react"

// Coordenadas del SVG (viewBox 0 0 140 220): cuerpo cilíndrico de y=40 a y=125,
// cono de y=125 a la punta en y=195. Esto refleja la geometría real del silo
// (no es un cilindro simple), tal como se definió en el diseño del piloto.
const BODY_TOP = 40
const CONE_TIP = 195
const USABLE_HEIGHT_PX = CONE_TIP - BODY_TOP // 155px representan altura_cono_m + altura_cilindro_m

// Umbrales de estado: son un punto de partida razonable, no están calibrados
// todavía contra el margen real de reserva de alimento (ese dato sale del
// piloto). Ajustar aquí cuando se tenga ese número.
function estadoPorPorcentaje(pct) {
  if (pct >= 40) return { label: "normal", classes: "bg-green-50 text-green-700" }
  if (pct >= 15) return { label: "atención", classes: "bg-amber-50 text-amber-700" }
  return { label: "crítico", classes: "bg-red-50 text-red-700" }
}

function fillColorFor(label) {
  if (label === "normal") return "#639922"
  if (label === "atención") return "#BA7517"
  return "#E24B4A"
}

export default function SiloCard({ silo, onSelect, selected, ordenPendiente, onEditar }) {
  const nivel = silo.nivel_actual
  const sinDatos = !nivel

  const alturaUtil = silo.altura_cono_m + silo.altura_cilindro_m
  const fraccion = sinDatos
    ? 0
    : Math.max(0, Math.min(1, nivel.altura_alimento_m / alturaUtil))
  const fillTopY = CONE_TIP - fraccion * USABLE_HEIGHT_PX
  const fillHeight = CONE_TIP - fillTopY

  const estado = sinDatos ? { label: "sin datos", classes: "bg-gray-100 text-gray-500" } : estadoPorPorcentaje(nivel.porcentaje)
  const fillColor = sinDatos ? "#D3D1C7" : fillColorFor(estado.label)
  const clipId = `clip-silo-${silo.id}`

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(silo.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect?.(silo.id) }}
      className={`relative text-left bg-white rounded-xl p-4 border transition cursor-pointer ${
        selected ? "border-granjazul-blue ring-1 ring-granjazul-blue" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {onEditar && (
        <button
          onClick={(e) => { e.stopPropagation(); onEditar(silo) }}
          className="absolute top-3 right-3 text-gray-300 hover:text-granjazul-blue"
          title="Editar silo"
        >
          <Pencil size={14} />
        </button>
      )}

      <div className="flex items-center justify-between mb-2 pr-5">
        <span className="text-sm font-medium text-gray-700">{silo.nombre}</span>
        <div className="flex items-center gap-1">
          {ordenPendiente && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 whitespace-nowrap">
              orden pendiente
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${estado.classes}`}>{estado.label}</span>
        </div>
      </div>

      <svg viewBox="0 0 140 220" className="w-full max-w-[130px] mx-auto" aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <path d="M25,40 L115,40 L115,125 L70,195 L25,125 Z" />
          </clipPath>
        </defs>
        <rect x="25" y="40" width="90" height="85" fill="#D3D1C7" />
        <polygon points="25,125 115,125 70,195" fill="#D3D1C7" />
        {!sinDatos && (
          <rect x="20" y={fillTopY} width="100" height={fillHeight} fill={fillColor} clipPath={`url(#${clipId})`} />
        )}
        <path d="M25,40 L115,40 L115,125 L70,195 L25,125 Z" fill="none" stroke="#888780" strokeWidth="2" />
        {[40, 55, 85, 100].map((x) => (
          <line key={x} x1={x} y1="40" x2={x} y2="125" stroke="#B4B2A9" strokeWidth="1" />
        ))}
        <polygon points="15,40 125,40 70,10" fill="#D3D1C7" stroke="#888780" strokeWidth="1.5" />
        <rect x="35" y="195" width="8" height="20" fill="#D3D1C7" />
        <rect x="97" y="195" width="8" height="20" fill="#D3D1C7" />
        <line x1="10" y1="215" x2="130" y2="215" stroke="#B4B2A9" />
        <rect x="96" y="6" width="10" height="10" fill="#888780" />
        {!sinDatos && (
          <line x1="101" y1="16" x2="101" y2={fillTopY} stroke="#5F5E5A" strokeWidth="1.5" strokeDasharray="3,3" />
        )}
      </svg>

      {sinDatos ? (
        <p className="mt-2 text-center text-sm text-gray-400">Sin lecturas todavía</p>
      ) : (
        <>
          <p className="mt-2 text-center text-2xl font-medium">{nivel.porcentaje.toFixed(0)}%</p>
          <p className="text-center text-xs text-gray-500">{nivel.kg_estimados.toFixed(0)} kg estimados</p>
        </>
      )}
    </div>
  )
}
