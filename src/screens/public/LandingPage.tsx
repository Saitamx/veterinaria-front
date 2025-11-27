import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { useAppointments } from '../../contexts/AppointmentsContext'
import { api } from '../../services/backendApi'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

export function LandingPage() {
	const { user } = useAuth()
	const { show } = useToast()
	const { vets, create } = useAppointments()
	const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null)
	const [form, setForm] = useState({
		clientName: '',
		clientPhone: '',
		petName: '',
		petSpecies: 'Perro',
		vetId: '',
		date: dayjs().format('YYYY-MM-DD'),
		slot: '',
		reason: 'Reserva desde la web'
	})
	const [slots, setSlots] = useState<string[]>([])
	const [errors, setErrors] = useState<{ vetId?: string; date?: string; slot?: string; reason?: string }>({})
	useEffect(() => {
		if (user?.role === 'cliente') {
			setForm((f) => ({ ...f, clientName: user.name, clientPhone: user.phone ?? f.clientPhone }))
		}
	}, [user])
	useEffect(() => {
		async function loadSlots() {
			if (user && form.vetId && form.date) {
				const s = await api.slots(form.vetId, dayjs(form.date).format('YYYY-MM-DD'))
				setSlots(s)
				setForm((f) => ({ ...f, slot: '' }))
			}
		}
		loadSlots()
	}, [user, form.vetId, form.date])

	async function submit() {
		try {
			if (!user) {
				show({ title: 'Debes iniciar sesión para reservar', variant: 'error' })
				return
			}
			const e: typeof errors = {}
			if (!form.vetId) e.vetId = 'Selecciona un veterinario'
			if (!form.date) e.date = 'Selecciona una fecha'
			if (!form.slot) e.slot = 'Selecciona un horario disponible'
			if (!form.reason || form.reason.trim().length < 3) e.reason = 'Indica el motivo (mínimo 3 caracteres)'
			setErrors(e)
			if (Object.keys(e).length > 0) return
			await create({ vetId: form.vetId, reason: form.reason, dateISO: form.slot })
			show({ title: 'Cita solicitada', variant: 'success' })
			setForm((f) => ({ ...f, slot: '' }))
		} catch (e: any) {
			const msg = typeof e?.message === 'string' ? e.message : 'No se pudo crear la cita'
			show({ title: 'Error al reservar', description: msg, variant: 'error' })
		}
	}

	// Inline auth forms inside landing
	const [loginEmail, setLoginEmail] = useState('')
	const [loginPassword, setLoginPassword] = useState('')
	const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({})
	const [loginGeneralError, setLoginGeneralError] = useState<string | null>(null)
	const [regName, setRegName] = useState('')
	const [regPhone, setRegPhone] = useState('')
	const [regEmail, setRegEmail] = useState('')
	const [regPassword, setRegPassword] = useState('')
	const [regConfirm, setRegConfirm] = useState('')
	const [authLoading, setAuthLoading] = useState(false)
	const [authErrors, setAuthErrors] = useState<{ name?: string; phone?: string; email?: string; password?: string; confirm?: string }>({})
	const { login, registerClient } = useAuth()

	function validateLogin(): boolean {
		const e: typeof loginErrors = {}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) e.email = 'Ingresa un correo válido'
		if (loginPassword.length < 6) e.password = 'La contraseña debe tener al menos 6 caracteres'
		setLoginErrors(e)
		return Object.keys(e).length === 0
	}

	async function submitLogin(e: React.FormEvent) {
		e.preventDefault()
		if (!validateLogin()) return
		setAuthLoading(true)
		setLoginGeneralError(null)
		try {
			const ok = await login(loginEmail, loginPassword)
			if (!ok) throw new Error('Credenciales inválidas')
			show({ title: 'Bienvenido', variant: 'success' })
			setAuthMode(null)
		} catch (err: any) {
			let msg = 'Credenciales inválidas'
			if (typeof err?.message === 'string') {
				try {
					const parsed = JSON.parse(err.message)
					msg = parsed?.error ?? msg
				} catch {
					msg = err.message || msg
				}
			}
			setLoginGeneralError(msg)
			show({ title: 'No se pudo iniciar sesión', description: msg, variant: 'error' })
		} finally {
			setAuthLoading(false)
		}
	}

	function validateRegister(): boolean {
		const e: typeof authErrors = {}
		if (regName.trim().length < 2) e.name = 'Ingresa tu nombre completo'
		if (!/^[0-9+()\-\s]{6,}$/.test(regPhone)) e.phone = 'Ingresa un teléfono válido'
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) e.email = 'Ingresa un correo válido'
		if (regPassword.length < 6) e.password = 'La contraseña debe tener al menos 6 caracteres'
		if (regConfirm !== regPassword) e.confirm = 'Las contraseñas no coinciden'
		setAuthErrors(e)
		return Object.keys(e).length === 0
	}

	async function submitRegister(e: React.FormEvent) {
		e.preventDefault()
		if (!validateRegister()) return
		setAuthLoading(true)
		try {
			const ok = await registerClient({ name: regName, email: regEmail, password: regPassword, phone: regPhone })
			if (!ok) throw new Error('No se pudo registrar')
			show({ title: 'Registro exitoso', variant: 'success' })
			setAuthMode(null)
		} catch (err: any) {
			const msg = typeof err?.message === 'string' ? err.message : 'No se pudo registrar'
			show({ title: 'Error en registro', description: msg, variant: 'error' })
		} finally {
			setAuthLoading(false)
		}
	}

	return (
		<div className="relative min-h-screen">
			<video className="fixed inset-0 h-screen w-screen object-cover" autoPlay muted loop playsInline>
				<source src="/video-fondo.mp4" type="video/mp4" />
			</video>
			<div className="fixed inset-0 bg-black/50" />
			<div className="fixed inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/60" />

			<section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-2">
				<div className="flex flex-col justify-center text-white">
					<h1 className="text-3xl font-bold sm:text-4xl">Veterinaria Pochita S.A.</h1>
					<p className="mt-3 max-w-prose text-white/90">
						Cuidamos a tu mascota con amor y profesionalismo. Agenda tu hora con nuestros especialistas.
					</p>
					<div className="mt-8 grid grid-cols-3 gap-4 text-sm">
						<div className="rounded-xl bg-white/10 p-4 backdrop-blur">
							<div className="text-2xl">🩺</div>
							<div className="mt-1 font-medium">Atención Experta</div>
						</div>
						<div className="rounded-xl bg-white/10 p-4 backdrop-blur">
							<div className="text-2xl">⏱️</div>
							<div className="mt-1 font-medium">Agenda Flexible</div>
						</div>
						<div className="rounded-xl bg-white/10 p-4 backdrop-blur">
							<div className="text-2xl">❤️</div>
							<div className="mt-1 font-medium">Cuidado Amoroso</div>
						</div>
					</div>
				</div>

				<div id="reserva" className="flex items-start justify-end">
					{user ? (
						<div className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/90 p-6 shadow-2xl backdrop-blur">
							<h2 className="text-lg font-semibold text-gray-900">Reserva tu hora</h2>
							<p className="text-sm text-gray-600">Elige veterinario, fecha y horario disponible.</p>
							<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
								<Input placeholder="Tu nombre" value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} />
								<Input placeholder="Tu teléfono" value={form.clientPhone} onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))} />
								<Select value={form.vetId} onChange={(e) => setForm((f) => ({ ...f, vetId: e.target.value }))} label="Veterinario" error={errors.vetId}>
									<option value="">Veterinario</option>
									{vets.map((v) => (
										<option key={v.id} value={v.id}>{v.name}</option>
									))}
								</Select>
								<Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} label="Fecha" error={errors.date} />
								<Select value={form.slot} onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value }))} label="Horario" error={errors.slot}>
									<option value="">Horario</option>
									{slots.map((s) => (
										<option key={s} value={s}>{dayjs(s).format('HH:mm')}</option>
									))}
								</Select>
								<div className="sm:col-span-2">
									<Select
										label="Motivo"
										value={form.reason}
										onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
										error={errors.reason}
									>
										<option value="">Selecciona un motivo</option>
										<option>Control general</option>
										<option>Vacunación</option>
										<option>Desparasitación</option>
										<option>Cirugía menor</option>
										<option>Consulta por síntomas</option>
										<option>Otro</option>
									</Select>
								</div>
							</div>
							<div className="mt-5 flex items-center justify-end">
								<Button onClick={submit} className="w-full sm:w-auto">Reservar</Button>
							</div>
						</div>
					) : authMode === 'login' ? (
						<div className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur">
							<h2 className="text-lg font-semibold text-gray-900">Inicia sesión</h2>
							<p className="text-sm text-gray-600">Accede para reservar tu hora</p>
							<form className="mt-4 space-y-4" onSubmit={submitLogin} noValidate>
								{loginGeneralError ? (
									<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
										{loginGeneralError}
									</div>
								) : null}
								<Input
									type="email"
									label="Correo electrónico"
									placeholder="tu@correo.com"
									value={loginEmail}
									onChange={(e) => setLoginEmail(e.target.value)}
									onBlur={() => setLoginErrors((prev) => ({ ...prev, email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail) ? undefined : 'Ingresa un correo válido' }))}
									error={loginErrors.email}
									hint="Ingresa un correo válido"
									title="Ingresa un correo válido"
								/>
								<Input
									type="password"
									label="Contraseña"
									placeholder="••••••"
									value={loginPassword}
									onChange={(e) => setLoginPassword(e.target.value)}
									onBlur={() => setLoginErrors((prev) => ({ ...prev, password: loginPassword.length < 6 ? 'La contraseña debe tener al menos 6 caracteres' : undefined }))}
									error={loginErrors.password}
									hint="Mínimo 6 caracteres"
									title="Mínimo 6 caracteres"
								/>
								<div className="flex items-center justify-between">
									<Button type="button" variant="outline" onClick={() => setAuthMode(null)}>Volver</Button>
									<Button type="submit" isLoading={authLoading}>Ingresar</Button>
								</div>
							</form>
							<p className="mt-3 text-xs text-gray-600">
								¿Aún no tienes cuenta? <button className="text-primary-600 hover:underline" onClick={() => setAuthMode('register')}>Regístrate</button>
							</p>
						</div>
					) : authMode === 'register' ? (
						<div className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur">
							<h2 className="text-lg font-semibold text-gray-900">Crear cuenta</h2>
							<p className="text-sm text-gray-600">Regístrate para reservar</p>
							<form className="mt-4 space-y-4" onSubmit={submitRegister} autoComplete="off" noValidate>
								<Input label="Nombre completo" placeholder="Ej. Juan Pérez" value={regName} onChange={(e) => setRegName(e.target.value)} error={authErrors.name} autoComplete="off" />
								<Input label="Teléfono" placeholder="Ej. 999-111-222" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} error={authErrors.phone} autoComplete="off" />
								<Input type="email" label="Correo" placeholder="tu@correo.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} error={authErrors.email} autoComplete="off" />
								<Input type="password" label="Contraseña" placeholder="••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} error={authErrors.password} autoComplete="new-password" />
								<Input type="password" label="Confirmar contraseña" placeholder="••••••" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} error={authErrors.confirm} autoComplete="new-password" />
								<div className="flex items-center justify-between">
									<Button type="button" variant="outline" onClick={() => setAuthMode(null)}>Volver</Button>
									<Button type="submit" isLoading={authLoading}>Registrarme</Button>
								</div>
							</form>
							<p className="mt-3 text-xs text-gray-600">
								¿Ya tienes cuenta? <button className="text-primary-600 hover:underline" onClick={() => setAuthMode('login')}>Inicia sesión</button>
							</p>
						</div>
					) : (
						<div className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/20 p-6 text-white shadow-2xl backdrop-blur">
							<h2 className="text-lg font-semibold">Reserva tu hora</h2>
							<p className="text-sm text-white/90">Para reservar debes iniciar sesión o registrarte.</p>
							<div className="mt-4 grid grid-cols-2 gap-3">
								<button onClick={() => setAuthMode('login')} className="btn btn-outline bg-white/10 text-white hover:bg-white/20">Iniciar sesión</button>
								<button onClick={() => setAuthMode('register')} className="btn btn-primary">Registrarme</button>
							</div>
							<div className="mt-6 grid grid-cols-2 gap-3 text-xs text-white/80">
								<div className="rounded-lg border border-white/20 p-3">
									<div className="font-medium">Veterinarios</div>
									<div>Elige entre nuestros especialistas</div>
								</div>
								<div className="rounded-lg border border-white/20 p-3">
									<div className="font-medium">Horarios</div>
									<div>Selecciona la fecha y hora disponible</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</section>
		</div>
	)
}


