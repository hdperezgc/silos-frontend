const API_URL = import.meta.env.VITE_API_URL

function getToken() {
  return localStorage.getItem("granjazul_token")
}

export function setToken(token) {
  localStorage.setItem("granjazul_token", token)
}

export function clearToken() {
  localStorage.removeItem("granjazul_token")
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { "Content-Type": "application/json", ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    window.location.reload()
    throw new Error("Sesión expirada")
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Error ${res.status}`)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request("/auth/me"),
  fincas: () => request("/fincas"),
  silos: (fincaId) => request(`/silos${fincaId ? `?finca_id=${fincaId}` : ""}`),
  silo: (id) => request(`/silos/${id}`),
  lecturas: (id, params = "") => request(`/silos/${id}/lecturas${params}`),
  proyeccion: (id) => request(`/silos/${id}/proyeccion`),
}
