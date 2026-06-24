import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { iniciarSesion, verificar2FA, cancelar2FA, pending2FA, cargando, error } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [otp, setOtp] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    const result = await iniciarSesion(form.email, form.password)
    if (result?.ok) navigate('/')
    // Si result.requires_2fa, el componente mostrará el paso de OTP automáticamente
  }

  const handleOtp = async (e) => {
    e.preventDefault()
    const result = await verificar2FA(otp)
    if (result?.ok) navigate('/')
  }

  // ── Paso 2: verificar código OTP ──────────────────────────────────────────
  if (pending2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a365d] px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔐</div>
            <h2 className="text-xl font-bold text-[#1a365d]">Verificación en dos pasos</h2>
            <p className="text-gray-500 text-sm mt-1">
              Ingresa el código de 6 dígitos de tu app autenticadora.
            </p>
          </div>

          <form onSubmit={handleOtp} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#f56523]"
            />

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando || otp.length < 6}
              className="w-full bg-[#f56523] hover:bg-[#d9541a] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {cargando ? 'Verificando...' : 'Verificar'}
            </button>

            <button
              type="button"
              onClick={cancelar2FA}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
            >
              ← Volver al inicio de sesión
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Paso 1: email + contraseña ─────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a365d] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1a365d]">Finca Primavera</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de gestión</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523] focus:border-transparent"
              placeholder="admin@primavera.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523] focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#f56523] hover:bg-[#d9541a] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
