import { useEffect, useState } from "react"
import { api } from "../api"

const SILO_FIELDS = [
  { key: "codigo", label: "Código", type: "text", placeholder: "ej. S-01" },
  { key: "nombre", label: "Nombre", type: "text", placeholder: "ej. Silo torre 1" },
  { key: "diametro_m", label: "Diámetro (m)", type: "number", step: "0.01" },
  { key: "altura_total_m", label: "Altura total (m)", type: "number", step: "0.01" },
  { key: "altura_cilindro_m", label: "Altura cilindro (m)", type: "number", step: "0.01" },
  { key: "altura_cono_m", label: "Altura cono (m)", type: "number", step: "0.01" },
  { key: "angulo_cono_grados", label: "Ángulo del cono (°)", type: "number", step: "0.1" },
  { key: "altura_zona_ciega_cm", label: "Zona ciega (cm)", type: "number", step: "1" },
  { key: "capacidad_kg", label: "Capacidad (kg)", type: "number", step: "1" },
  { key: "densidad_alimento_kg_m3", label: "Densidad del alimento (kg/m³)", type: "number", step: "1" },
  { key: "lead_time_dias", label: "Lead time del molino (días, opcional)", type: "number", step: "1" },
]

const SILO_FORM_VACIO = {
  finca_id: "",
  codigo: "",
  nombre: "",
  diametro_m: "",
  altura_total_m: "",
  altura_cilindro_m: "",
  altura_cono_m: "",
  angulo_cono_grados: "",
  altura_zona_ciega_cm: "",
  capacidad_kg: "",
  densidad_alimento_kg_m3: "",
  lead_time_dias: "",
}

function FormNuevaFinca({ onCreada, onCancelar }) {
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.crearFinca({ nombre })
      onCreada()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-medium mb-4">Nueva finca</h3>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Nombre</label>
          <input
            required
            minLength={2}
            maxLength={120}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-granjazul-blue"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm text-white bg-granjazul-blue rounded-lg disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear finca"}
          </button>
        </div>
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
      </form>
    </div>
  )
}

function VistaFincas() {
  const [fincas, setFincas] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  function cargar() {
    setLoading(true)
    api.fincas().then(setFincas).finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  return (
    <div>
      {mostrarForm ? (
        <FormNuevaFinca
          onCreada={() => { setMostrarForm(false); cargar() }}
          onCancelar={() => setMostrarForm(false)}
        />
      ) : (
        <button
          onClick={() => setMostrarForm(true)}
          className="mb-4 text-sm text-white bg-granjazul-blue px-4 py-2 rounded-lg"
        >
          + Nueva finca
        </button>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Cargando fincas...</p>
      ) : fincas.length === 0 ? (
        <p className="text-sm text-gray-400">No hay fincas registradas todavía.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
              <th className="pb-2 pr-4">ID</th>
              <th className="pb-2">Nombre</th>
            </tr>
          </thead>
          <tbody>
            {fincas.map((f) => (
              <tr key={f.id} className="border-t border-gray-100">
                <td className="py-3 pr-4 text-sm text-gray-400">{f.id}</td>
                <td className="py-3 text-sm font-medium">{f.nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function FormNuevoSilo({ fincas, silos, onCreado, onCancelar }) {
  const [form, setForm] = useState({ ...SILO_FORM_VACIO, finca_id: fincas[0]?.id ?? "" })
  const [origenId, setOrigenId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function setCampo(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleClonar(siloIdStr) {
    setOrigenId(siloIdStr)
    if (siloIdStr === "") {
      setForm({ ...SILO_FORM_VACIO, finca_id: fincas[0]?.id ?? "" })
      return
    }
    const origen = silos.find((s) => s.id === Number(siloIdStr))
    if (!origen) return
    setForm({
      finca_id: origen.finca_id,
      codigo: "",
      nombre: "",
      diametro_m: origen.diametro_m,
      altura_total_m: origen.altura_total_m,
      altura_cilindro_m: origen.altura_cilindro_m,
      altura_cono_m: origen.altura_cono_m,
      angulo_cono_grados: origen.angulo_cono_grados,
      altura_zona_ciega_cm: origen.altura_zona_ciega_cm,
      capacidad_kg: origen.capacidad_kg,
      densidad_alimento_kg_m3: origen.densidad_alimento_kg_m3,
      lead_time_dias: origen.lead_time_dias ?? "",
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const payload = {
        finca_id: Number(form.finca_id),
        codigo: form.codigo,
        nombre: form.nombre,
        diametro_m: Number(form.diametro_m),
        altura_total_m: Number(form.altura_total_m),
        altura_cono_m: Number(form.altura_cono_m),
        altura_cilindro_m: Number(form.altura_cilindro_m),
        angulo_cono_grados: Number(form.angulo_cono_grados),
        altura_zona_ciega_cm: Number(form.altura_zona_ciega_cm),
        capacidad_kg: Number(form.capacidad_kg),
        densidad_alimento_kg_m3: Number(form.densidad_alimento_kg_m3),
        lead_time_dias: form.lead_time_dias === "" ? null : Number(form.lead_time_dias),
      }
      await api.crearSilo(payload)
      onCreado()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-medium mb-4">Nuevo silo</h3>
      {silos.length > 0 && (
        <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <label className="block text-xs text-gray-500 mb-1">Clonar desde un silo existente (opcional)</label>
          <select
            value={origenId}
            onChange={(e) => handleClonar(e.target.value)}
            className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">— Crear desde cero —</option>
            {silos.map((s) => (
              <option key={s.id} value={s.id}>{s.codigo} · {s.nombre}</option>
            ))}
          </select>
          {origenId !== "" && (
            <p className="text-[11px] text-gray-400 mt-1">
              Se copiaron las medidas y capacidad del silo seleccionado. Solo falta el código y nombre nuevos.
            </p>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Finca</label>
          <select
            required
            value={form.finca_id}
            onChange={(e) => setCampo("finca_id", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {fincas.map((f) => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </select>
        </div>
        {SILO_FIELDS.map(({ key, label, type, step, placeholder }) => (
          <div key={key}>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <input
              type={type}
              step={step}
              min={type === "number" ? "0" : undefined}
              required={key !== "lead_time_dias"}
              placeholder={placeholder}
              value={form[key]}
              onChange={(e) => setCampo(key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-granjazul-blue"
            />
          </div>
        ))}
        {error && <p className="sm:col-span-2 text-xs text-red-600">{error}</p>}
        <div className="sm:col-span-2 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm text-white bg-granjazul-blue rounded-lg disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear silo"}
          </button>
        </div>
      </form>
    </div>
  )
}

function VistaSilos() {
  const [fincas, setFincas] = useState([])
  const [silos, setSilos] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  function cargar() {
    setLoading(true)
    Promise.all([api.fincas(), api.silos()])
      .then(([fincasData, silosData]) => {
        setFincas(fincasData)
        setSilos(silosData)
      })
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  const nombreFinca = (id) => fincas.find((f) => f.id === id)?.nombre ?? "—"

  return (
    <div>
      {fincas.length === 0 && !loading ? (
        <p className="text-sm text-amber-600 mb-4">
          Primero necesitas crear una finca antes de poder registrar un silo.
        </p>
      ) : mostrarForm ? (
        <FormNuevoSilo
          fincas={fincas}
          silos={silos}
          onCreado={() => { setMostrarForm(false); cargar() }}
          onCancelar={() => setMostrarForm(false)}
        />
      ) : (
        <button
          onClick={() => setMostrarForm(true)}
          disabled={fincas.length === 0}
          className="mb-4 text-sm text-white bg-granjazul-blue px-4 py-2 rounded-lg disabled:opacity-50"
        >
          + Nuevo silo
        </button>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Cargando silos...</p>
      ) : silos.length === 0 ? (
        <p className="text-sm text-gray-400">No hay silos registrados todavía.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
              <th className="pb-2 pr-4">Código</th>
              <th className="pb-2 pr-4">Nombre</th>
              <th className="pb-2 pr-4">Finca</th>
              <th className="pb-2 pr-4">Capacidad</th>
              <th className="pb-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {silos.map((s) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="py-3 pr-4 text-sm font-medium">{s.codigo}</td>
                <td className="py-3 pr-4 text-sm">{s.nombre}</td>
                <td className="py-3 pr-4 text-sm text-gray-500">{nombreFinca(s.finca_id)}</td>
                <td className="py-3 pr-4 text-sm text-gray-500">{s.capacidad_kg?.toLocaleString()} kg</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    s.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                  }`}>
                    {s.activo ? "activo" : "inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function Mantenimiento() {
  const [tab, setTab] = useState("fincas")

  return (
    <div className="py-8 px-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium">Mantenimiento</h2>
        <p className="text-sm text-gray-500">creación de fincas y silos</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { id: "fincas", label: "Fincas" },
          { id: "silos", label: "Silos" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`text-sm px-4 py-1.5 rounded-md font-medium transition-all ${
              tab === id ? "bg-white text-granjazul-blue shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "fincas" ? <VistaFincas /> : <VistaSilos />}
    </div>
  )
}
