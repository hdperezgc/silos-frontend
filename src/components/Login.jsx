import { useState } from "react"
import { api, setToken } from "../api"

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const { access_token } = await api.login(email, password)
      setToken(access_token)
      onLogin()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="Granjazul" className="h-20 object-contain mb-2" />
          <p className="text-sm text-gray-500">Monitoreo de silos</p>
        </div>

        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-granjazul-blue"
        />

        <label className="block text-sm text-gray-600 mb-1">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-granjazul-blue"
        />

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-granjazul-blue text-white rounded-lg py-2 font-medium disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  )
}
