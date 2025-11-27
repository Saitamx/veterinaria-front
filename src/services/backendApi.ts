const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function authHeaders() {
	const token = localStorage.getItem('auth_token')
	return token ? { Authorization: `Bearer ${token}` } : {}
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, {
		...init,
		headers: {
			'Content-Type': 'application/json',
			...(init?.headers || {}),
			...authHeaders()
		}
	})
	if (!res.ok) {
		const txt = await res.text().catch(() => '')
		throw new Error(txt || `HTTP ${res.status}`)
	}
	return (await res.json()) as T
}

export type ApiUser = { id: string; name: string; email: string; role: 'CLIENTE' | 'RECEPCIONISTA' | 'VETERINARIO' | 'ADMIN'; phone?: string }
export type Vet = { id: string; name: string }
export type Appointment = {
	id: string
	userId: string
	vetId: string
	reason: string
	dateTime: string
	status: 'PROGRAMADA' | 'CONFIRMADA' | 'CANCELADA'
	vet?: Vet
}

export const api = {
	async register(input: { name: string; email: string; password: string; phone?: string }) {
		return http<{ token: string; user: ApiUser }>('/auth/register', { method: 'POST', body: JSON.stringify(input) })
	},
	async login(input: { email: string; password: string }) {
		return http<{ token: string; user: ApiUser }>('/auth/login', { method: 'POST', body: JSON.stringify(input) })
	},
	async vets() {
		return http<Vet[]>('/vets')
	},
	async slots(vetId: string, date: string) {
		const q = new URLSearchParams({ vetId, date })
		return http<string[]>(`/slots?${q.toString()}`)
	},
	async appointments() {
		return http<Appointment[]>('/appointments')
	},
	async createAppointment(input: { vetId: string; dateISO: string; reason: string }) {
		return http<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(input) })
	},
	async rescheduleAppointment(id: string, input: { vetId: string; dateISO: string }) {
		return http<Appointment>(`/appointments/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify(input) })
	},
	async cancelAppointment(id: string, canceledBy: 'vet' | 'client') {
		return http<Appointment>(`/appointments/${id}?canceledBy=${canceledBy}`, { method: 'DELETE' })
	},
	events(onEvent: (e: MessageEvent) => void) {
		const es = new EventSource(`${BASE_URL}/events`)
		es.addEventListener('vet-cancel', onEvent as any)
		return () => es.close()
	}
}


