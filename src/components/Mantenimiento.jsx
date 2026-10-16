import { useEffect, useState } from "react"
import { api } from "../api"

// La bandera "solicitar lectura ahora" queda apagada mientras el firmware del
// Arduino no consulte /sensores/config: sin eso la solicitud se queda en
// "pendiente" y nadie la atiende. Poner en true cuando el sketch la use.
const MOSTRAR_SOLICITAR_LECTURA = false

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

function ApiKeyModal({ deviceId, apiKey, onCerrar }) {
  const [copiado, setCopiado] = useState(false)

  function handleCopiar() {
    navigator.clipboard.writeText(apiKey).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
        <h3 className="text-base font-medium mb-1">API key generada</h3>
        <p className="text-sm text-gray-500 mb-4">
          Sensor <span className="font-medium">{deviceId}</span>. Cópiala y configúrala en el dispositivo ahora:
          por seguridad no se va a volver a mostrar.
        </p>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4">
          <code className="flex-1 text-xs break-all">{apiKey}</code>
          <button
            onClick={handleCopiar}
            className="text-xs text-granjazul-blue hover:underline whitespace-nowrap"
          >
            {copiado ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-sm text-white bg-granjazul-blue rounded-lg"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}

const SENSOR_FORM_VACIO = {
  finca_id: "",
  silo_id: "",
  device_id: "",
  modelo: "DYP-A01-V2.0",
  fecha_instalacion: new Date().toISOString().slice(0, 10),
}

function FormNuevoSensor({ fincas, silos, onCreado, onCancelar }) {
  const [form, setForm] = useState({ ...SENSOR_FORM_VACIO, finca_id: fincas[0]?.id ?? "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const silosDeFinca = silos.filter((s) => s.finca_id === Number(form.finca_id))

  function setCampo(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleFinca(fincaIdStr) {
    const nuevosSilos = silos.filter((s) => s.finca_id === Number(fincaIdStr))
    setForm((prev) => ({ ...prev, finca_id: fincaIdStr, silo_id: nuevosSilos[0]?.id ?? "" }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const creado = await api.crearSensor({
        silo_id: Number(form.silo_id),
        device_id: form.device_id,
        modelo: form.modelo,
        fecha_instalacion: form.fecha_instalacion,
      })
      onCreado(creado)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-medium mb-4">Nuevo sensor</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Finca</label>
          <select
            required
            value={form.finca_id}
            onChange={(e) => handleFinca(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {fincas.map((f) => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Silo</label>
          <select
            required
            disabled={silosDeFinca.length === 0}
            value={form.silo_id}
            onChange={(e) => setCampo("silo_id", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            <option value="">selecciona un silo</option>
            {silosDeFinca.map((s) => (
              <option key={s.id} value={s.id}>{s.codigo} · {s.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">ID del dispositivo</label>
          <input
            required
            minLength={2}
            maxLength={60}
            placeholder="ej. ESP32-A1B2C3"
            value={form.device_id}
            onChange={(e) => setCampo("device_id", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-granjazul-blue"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Modelo</label>
          <input
            required
            maxLength={80}
            value={form.modelo}
            onChange={(e) => setCampo("modelo", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-granjazul-blue"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha de instalación</label>
          <input
            type="date"
            required
            value={form.fecha_instalacion}
            onChange={(e) => setCampo("fecha_instalacion", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-granjazul-blue"
          />
        </div>
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
            disabled={loading || !form.silo_id}
            className="px-4 py-2 text-sm text-white bg-granjazul-blue rounded-lg disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear sensor"}
          </button>
        </div>
      </form>
    </div>
  )
}

function FilaSensor({ sensor, nombreSilo, onActualizado, onNuevaApiKey }) {
  const [loading, setLoading] = useState(false)

  async function handleToggleActivo() {
    setLoading(true)
    try {
      await api.actualizarSensor(sensor.id, { activo: !sensor.activo })
      onActualizado()
    } finally {
      setLoading(false)
    }
  }

  async function handleRegenerar() {
    if (!window.confirm(
      `¿Regenerar la API key de ${sensor.device_id}? La clave anterior dejará de funcionar de inmediato.`
    )) return
    setLoading(true)
    try {
      const { api_key } = await api.regenerarApiKeySensor(sensor.id)
      onNuevaApiKey(sensor.device_id, api_key)
    } finally {
      setLoading(false)
    }
  }

  async function handleSolicitarLectura() {
    setLoading(true)
    try {
      await api.solicitarLectura(sensor.id)
      onActualizado()
    } finally {
      setLoading(false)
    }
  }

  return (
    <tr className="border-t border-gray-100">
      <td className="py-3 pr-4 text-sm font-medium">{sensor.device_id}</td>
      <td className="py-3 pr-4 text-sm text-gray-500">{sensor.modelo}</td>
      <td className="py-3 pr-4 text-sm text-gray-500">{nombreSilo}</td>
      <td className="py-3 pr-4 text-sm text-gray-500">{sensor.fecha_instalacion}</td>
      <td className="py-3 pr-4">
        <button
          onClick={handleToggleActivo}
          disabled={loading}
          className={`text-xs px-3 py-1 rounded-full font-medium ${
            sensor.activo
              ? "bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600"
              : "bg-red-100 text-red-600 hover:bg-green-50 hover:text-green-700"
          }`}
        >
          {sensor.activo ? "activo" : "inactivo"}
        </button>
      </td>
      {MOSTRAR_SOLICITAR_LECTURA && (
      <td className="py-3 pr-4">
        {sensor.solicitud_lectura_pendiente ? (
          <span className="text-xs px-3 py-1 rounded-full font-medium bg-amber-100 text-amber-700">
            pendiente...
          </span>
        ) : (
          <button
            onClick={handleSolicitarLectura}
            disabled={loading || !sensor.activo}
            className="text-xs text-gray-400 hover:text-granjazul-blue underline disabled:opacity-40"
            title={!sensor.activo ? "El sensor está inactivo" : "El Arduino la verá en su próxima consulta"}
          >
            solicitar lectura ahora
          </button>
        )}
      </td>
      )}
      <td className="py-3">
        <button
          onClick={handleRegenerar}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-granjazul-blue underline"
        >
          regenerar API key
        </button>
      </td>
    </tr>
  )
}

function VistaSensores() {
  const [fincas, setFincas] = useState([])
  const [silos, setSilos] = useState([])
  const [sensores, setSensores] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [apiKeyInfo, setApiKeyInfo] = useState(null)

  function cargar() {
    setLoading(true)
    Promise.all([api.fincas(), api.silos(), api.sensores()])
      .then(([fincasData, silosData, sensoresData]) => {
        setFincas(fincasData)
        setSilos(silosData)
        setSensores(sensoresData)
      })
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  function nombreSilo(id) {
    const s = silos.find((s) => s.id === id)
    return s ? `${s.codigo} · ${s.nombre}` : "—"
  }

  return (
    <div>
      {silos.length === 0 && !loading ? (
        <p className="text-sm text-amber-600 mb-4">
          Primero necesitas crear un silo antes de poder registrar un sensor.
        </p>
      ) : mostrarForm ? (
        <FormNuevoSensor
          fincas={fincas}
          silos={silos}
          onCreado={(creado) => {
            setMostrarForm(false)
            cargar()
            setApiKeyInfo({ deviceId: creado.device_id, apiKey: creado.api_key })
          }}
          onCancelar={() => setMostrarForm(false)}
        />
      ) : (
        <button
          onClick={() => setMostrarForm(true)}
          disabled={silos.length === 0}
          className="mb-4 text-sm text-white bg-granjazul-blue px-4 py-2 rounded-lg disabled:opacity-50"
        >
          + Nuevo sensor
        </button>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Cargando sensores...</p>
      ) : sensores.length === 0 ? (
        <p className="text-sm text-gray-400">No hay sensores registrados todavía.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
              <th className="pb-2 pr-4">Dispositivo</th>
              <th className="pb-2 pr-4">Modelo</th>
              <th className="pb-2 pr-4">Silo</th>
              <th className="pb-2 pr-4">Instalado</th>
              <th className="pb-2 pr-4">Estado</th>
              {MOSTRAR_SOLICITAR_LECTURA && <th className="pb-2 pr-4">Lectura</th>}
              <th className="pb-2">API key</th>
            </tr>
          </thead>
          <tbody>
            {sensores.map((s) => (
              <FilaSensor
                key={s.id}
                sensor={s}
                nombreSilo={nombreSilo(s.silo_id)}
                onActualizado={cargar}
                onNuevaApiKey={(deviceId, apiKey) => setApiKeyInfo({ deviceId, apiKey })}
              />
            ))}
          </tbody>
        </table>
      )}

      {apiKeyInfo && (
        <ApiKeyModal
          deviceId={apiKeyInfo.deviceId}
          apiKey={apiKeyInfo.apiKey}
          onCerrar={() => setApiKeyInfo(null)}
        />
      )}
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

  async function handleDesactivar(silo) {
    if (!window.confirm(
      `¿Desactivar ${silo.codigo} · ${silo.nombre}? Dejará de aparecer en el panel. El historial se conserva.`
    )) return
    try {
      await api.actualizarSilo(silo.id, { activo: false })
      cargar()
    } catch (err) {
      window.alert(err.message)
    }
  }

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
              <th className="pb-2 pr-4">Estado</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {silos.map((s) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="py-3 pr-4 text-sm font-medium">{s.codigo}</td>
                <td className="py-3 pr-4 text-sm">{s.nombre}</td>
                <td className="py-3 pr-4 text-sm text-gray-500">{nombreFinca(s.finca_id)}</td>
                <td className="py-3 pr-4 text-sm text-gray-500">{s.capacidad_kg?.toLocaleString()} kg</td>
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    s.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                  }`}>
                    {s.activo ? "activo" : "inactivo"}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => handleDesactivar(s)}
                    className="text-xs text-red-600 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50"
                  >
                    Desactivar
                  </button>
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
        <p className="text-sm text-gray-500">creación de fincas, silos y sensores</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { id: "fincas", label: "Fincas" },
          { id: "silos", label: "Silos" },
          { id: "sensores", label: "Sensores" },
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

      {tab === "fincas" && <VistaFincas />}
      {tab === "silos" && <VistaSilos />}
      {tab === "sensores" && <VistaSensores />}
    </div>
  )
}
