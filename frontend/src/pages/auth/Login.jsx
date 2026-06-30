import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ICONO = '/assets/icons/dashboard%20icon.png'

const CARACTERISTICAS = [
  'Inventario y stock en tiempo real',
  'Compras, ventas y reportes diarios',
  'Labores, cosechas y transformaciones',
]

function IconoCorreo({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function IconoCandado({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function Spinner() {
  return (
    <span
      className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
      aria-hidden
    />
  )
}

function PanelMarca() {
  return (
    <div className="relative hidden lg:flex lg:w-[44%] xl:w-[48%] flex-col justify-between overflow-hidden bg-[#1a365d] text-white p-10 xl:p-14">
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#f56523]/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5 blur-2xl"
        aria-hidden
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <img src={ICONO} alt="" className="h-7 w-7 object-contain" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">Finca Primavera</p>
            <p className="text-sm text-white/60">Gestión productiva</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 my-10">
        <h2 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight">
          Todo tu negocio
          <span className="block text-[#f56523]">en un solo lugar</span>
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
          Registra ventas, compras e inventario desde el campo o la oficina. Diseñado para el día a día de la finca.
        </p>

        <ul className="mt-8 space-y-3">
          {CARACTERISTICAS.map((texto) => (
            <li key={texto} className="flex items-center gap-3 text-sm text-white/80">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f56523]/20 text-[#f56523]">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              {texto}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-xs text-white/40">
        © {new Date().getFullYear()} Finca Primavera
      </p>
    </div>
  )
}

function CabeceraMovil({ titulo, subtitulo }) {
  return (
    <div className="mb-8 text-center lg:hidden">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a365d]/5 ring-1 ring-[#1a365d]/10">
        <img src={ICONO} alt="" className="h-9 w-9 object-contain" />
      </div>
      <h1 className="text-2xl font-bold text-[#1a365d]">{titulo}</h1>
      {subtitulo && <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>}
    </div>
  )
}

function CampoInput({
  id,
  label,
  type = 'text',
  icon: Icon,
  suffix,
  ...props
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-5 h-5" />
          </span>
        )}
        <input
          id={id}
          type={type}
          className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-[#f56523] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f56523]/25 ${
            Icon ? 'pl-11 pr-4' : 'px-4'
          } ${suffix ? 'pr-11' : ''}`}
          {...props}
        />
        {suffix && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{suffix}</div>
        )}
      </div>
    </div>
  )
}

function MensajeError({ children }) {
  if (!children) return null
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span>{children}</span>
    </div>
  )
}

function BotonPrimario({ children, disabled, type = 'submit' }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f56523] py-3 text-sm font-semibold text-white shadow-md shadow-[#f56523]/25 transition-all hover:bg-[#d9541a] hover:shadow-lg hover:shadow-[#f56523]/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
    >
      {children}
    </button>
  )
}

function LoginShell({ children, tituloMovil, subtituloMovil }) {
  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <PanelMarca />

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
        <div className="w-full max-w-[420px]">
          <CabeceraMovil titulo={tituloMovil} subtitulo={subtituloMovil} />

          <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-8">
            {children}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400 lg:hidden">
            Sistema de gestión para finca productiva
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  const { iniciarSesion, verificar2FA, cancelar2FA, pending2FA, cargando, error } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [otp, setOtp] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    const result = await iniciarSesion(form.email, form.password)
    if (result?.ok) navigate('/')
  }

  const handleOtp = async (e) => {
    e.preventDefault()
    const result = await verificar2FA(otp)
    if (result?.ok) navigate('/')
  }

  if (pending2FA) {
    return (
      <LoginShell tituloMovil="Verificación en dos pasos" subtituloMovil="Código de tu app autenticadora">
        <div className="mb-6 hidden lg:block">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1a365d]/5 text-2xl ring-1 ring-[#1a365d]/10">
            🔐
          </div>
          <h2 className="text-xl font-bold text-[#1a365d]">Verificación en dos pasos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ingresa el código de 6 dígitos de tu app autenticadora.
          </p>
        </div>

        <form onSubmit={handleOtp} className="space-y-5">
          <div>
            <label htmlFor="otp" className="mb-1.5 block text-sm font-medium text-slate-700">
              Código de verificación
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-center font-mono text-2xl tracking-[0.45em] text-[#1a365d] transition-colors focus:border-[#f56523] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f56523]/25"
            />
          </div>

          <MensajeError>{error}</MensajeError>

          <BotonPrimario disabled={cargando || otp.length < 6}>
            {cargando ? (
              <>
                <Spinner /> Verificando...
              </>
            ) : (
              'Verificar código'
            )}
          </BotonPrimario>

          <button
            type="button"
            onClick={cancelar2FA}
            className="w-full py-2 text-sm font-medium text-slate-500 transition-colors hover:text-[#1a365d]"
          >
            ← Volver al inicio de sesión
          </button>
        </form>
      </LoginShell>
    )
  }

  return (
    <LoginShell tituloMovil="Finca Primavera" subtituloMovil="Inicia sesión para continuar">
      <div className="mb-6 hidden lg:block">
        <h2 className="text-xl font-bold text-[#1a365d]">Bienvenido de nuevo</h2>
        <p className="mt-1 text-sm text-slate-500">Ingresa tus credenciales para acceder al sistema.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <CampoInput
          id="email"
          label="Correo electrónico"
          type="email"
          icon={IconoCorreo}
          required
          autoComplete="email"
          autoFocus
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="admin@primavera.com"
        />

        <CampoInput
          id="password"
          label="Contraseña"
          type={mostrarPassword ? 'text' : 'password'}
          icon={IconoCandado}
          required
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="••••••••"
          suffix={
            <button
              type="button"
              onClick={() => setMostrarPassword((v) => !v)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {mostrarPassword ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858 3.029a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          }
        />

        <MensajeError>{error}</MensajeError>

        <BotonPrimario disabled={cargando}>
          {cargando ? (
            <>
              <Spinner /> Ingresando...
            </>
          ) : (
            'Ingresar'
          )}
        </BotonPrimario>
      </form>
    </LoginShell>
  )
}
