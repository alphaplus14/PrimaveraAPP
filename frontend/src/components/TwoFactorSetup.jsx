import { useEffect, useState } from 'react'
import {
  twoFactorStatus,
  twoFactorEnable,
  twoFactorConfirm,
  twoFactorDisable,
  twoFactorRecoveryCodes,
  twoFactorRegenerateRecoveryCodes,
} from '../api/twoFactor'
import Modal from './ui/Modal'

export default function TwoFactorSetup() {
  const [estado, setEstado] = useState(null) // { enabled, confirmed }
  const [paso, setPaso] = useState('idle')   // idle | setup | recovery
  const [qrSvg, setQrSvg] = useState(null)
  const [secretKey, setSecretKey] = useState(null)
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState([])
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [mostrarDesactivar, setMostrarDesactivar] = useState(false)

  useEffect(() => {
    twoFactorStatus().then(({ data }) => setEstado(data.data)).catch(() => {})
  }, [])

  const iniciarActivacion = async () => {
    setCargando(true)
    setError(null)
    try {
      const { data } = await twoFactorEnable()
      setQrSvg(data.data.qr_code)
      setSecretKey(data.data.secret_key)
      setOtp('')
      setPaso('setup')
    } catch {
      setError('No se pudo iniciar la activación. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const confirmarActivacion = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    try {
      const { data } = await twoFactorConfirm(otp)
      setRecoveryCodes(data.data.recovery_codes)
      setEstado({ enabled: true, confirmed: true })
      setPaso('recovery')
    } catch (err) {
      setError(err.response?.data?.message || 'Código incorrecto.')
    } finally {
      setCargando(false)
    }
  }

  const desactivar = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    try {
      await twoFactorDisable(password)
      setEstado({ enabled: false, confirmed: false })
      setMostrarDesactivar(false)
      setPassword('')
    } catch (err) {
      setError(err.response?.data?.message || 'Contraseña incorrecta.')
    } finally {
      setCargando(false)
    }
  }

  const verCodigos = async () => {
    const { data } = await twoFactorRecoveryCodes()
    setRecoveryCodes(data.data)
    setPaso('recovery')
  }

  const regenerarCodigos = async () => {
    const { data } = await twoFactorRegenerateRecoveryCodes()
    setRecoveryCodes(data.data)
  }

  if (estado === null) {
    return <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
  }

  // ── Paso: mostrar recovery codes ──────────────────────────────────────────
  if (paso === 'recovery') {
    return (
      <div className="bg-white rounded-2xl border border-green-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🔑</span>
          <div>
            <h3 className="font-semibold text-gray-800">Códigos de recuperación</h3>
            <p className="text-xs text-gray-500">Guárdalos en un lugar seguro. Cada uno es de un solo uso.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {recoveryCodes.map((c, i) => (
            <code key={i} className="bg-gray-100 text-gray-700 rounded px-3 py-1.5 text-xs font-mono text-center">
              {c}
            </code>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={regenerarCodigos}
            className="text-xs text-amber-600 hover:underline"
          >
            Regenerar códigos
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={() => setPaso('idle')}
            className="text-xs text-gray-500 hover:underline"
          >
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  // ── Paso: escanear QR y confirmar ─────────────────────────────────────────
  if (paso === 'setup') {
    return (
      <div className="bg-white rounded-2xl border border-indigo-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-1">Configura tu autenticador</h3>
        <p className="text-xs text-gray-500 mb-4">
          Escanea el código QR con Google Authenticator, Authy u otra app TOTP.
        </p>

        {qrSvg && (
          <div
            className="flex justify-center mb-4 [&_svg]:w-44 [&_svg]:h-44"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        )}

        {secretKey && (
          <div className="mb-4 text-center">
            <p className="text-xs text-gray-400 mb-1">O ingresa la clave manual:</p>
            <code className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-mono break-all">
              {secretKey}
            </code>
          </div>
        )}

        <form onSubmit={confirmarActivacion} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Código de verificación (6 dígitos)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(null) }}
              placeholder="000000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-center font-mono tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={cargando || otp.length < 6}
              className="flex-1 bg-[#6366F1] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#5C27FE] disabled:opacity-60"
            >
              {cargando ? 'Verificando...' : 'Activar 2FA'}
            </button>
            <button
              type="button"
              onClick={() => setPaso('idle')}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ── Estado idle: 2FA activo o inactivo ────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{estado.enabled ? '🛡️' : '🔓'}</span>
          <div>
            <h3 className="font-semibold text-gray-800">Autenticación en dos pasos</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {estado.enabled
                ? '2FA activado. Tu cuenta está protegida.'
                : 'Agrega una capa extra de seguridad al iniciar sesión.'}
            </p>
          </div>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
          estado.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {estado.enabled ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <div className="flex gap-2 mt-4">
        {estado.enabled ? (
          <>
            <button
              type="button"
              onClick={verCodigos}
              className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Ver códigos de recuperación
            </button>
            <button
              type="button"
              onClick={() => { setMostrarDesactivar(true); setError(null) }}
              className="px-4 py-2 border border-red-200 rounded-xl text-sm text-red-600 hover:bg-red-50"
            >
              Desactivar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={iniciarActivacion}
            disabled={cargando}
            className="flex-1 bg-[#6366F1] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#5C27FE] disabled:opacity-60"
          >
            {cargando ? 'Configurando...' : 'Activar 2FA'}
          </button>
        )}
      </div>

      {mostrarDesactivar && (
        <Modal titulo="Desactivar 2FA" onClose={() => setMostrarDesactivar(false)}>
          <p className="text-sm text-gray-600 mb-4">
            Confirma tu contraseña para desactivar la autenticación en dos pasos.
          </p>
          <form onSubmit={desactivar} className="space-y-3">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
              placeholder="Tu contraseña actual"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60"
            >
              {cargando ? 'Desactivando...' : 'Confirmar y desactivar'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
