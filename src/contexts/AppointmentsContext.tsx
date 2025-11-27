import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useToast } from './ToastContext'
import { api, type Appointment as ApiAppointment, type Vet as ApiVet } from '../services/backendApi'
import { useAuth } from './AuthContext'

type AppointmentsContextValue = {
	vets: ApiVet[]
	appointments: ApiAppointment[]
	refresh: () => Promise<void>
	create: (input: { vetId: string; dateISO: string; reason: string }) => Promise<ApiAppointment>
	reschedule: (id: string, dateISO: string, vetId: string) => Promise<void>
	cancel: (id: string, by: 'vet' | 'client') => Promise<void>
}

const AppointmentsContext = createContext<AppointmentsContextValue | null>(null)

export function AppointmentsProvider({ children }: { children: ReactNode }) {
	const [vets, setVets] = useState<ApiVet[]>([])
	const [appointments, setAppointments] = useState<ApiAppointment[]>([])
	const { show } = useToast()
	const { user } = useAuth()

	async function refresh() {
		if (!user) {
			setVets([])
			setAppointments([])
			return
		}
		const [vs, aps] = await Promise.all([api.vets(), api.appointments()])
		setVets(vs)
		setAppointments(aps)
	}
	useEffect(() => {
		refresh()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user])

	// subscribe to vet cancel alerts
	useEffect(() => {
		if (!user) return
		const off = api.events((e) => {
			try {
				const data = JSON.parse((e as MessageEvent).data)
				if (e.type === 'vet-cancel') {
					show({ title: 'Horario cancelado por veterinario', description: `Vet: ${data.vetId}`, variant: 'info' })
					refresh()
				}
			} catch {
				// ignore
			}
		})
		return () => off()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user])

	const value = useMemo<AppointmentsContextValue>(
		() => ({
			vets,
			appointments,
			refresh,
			async create(input) {
				try {
					const apt = await api.createAppointment(input)
					await refresh()
					show({ title: 'Cita creada', variant: 'success' })
				 return apt
				} catch (e: any) {
					const msg = typeof e?.message === 'string' ? e.message : 'No se pudo crear la cita'
					show({ title: 'Error', description: msg, variant: 'error' })
					throw e
				}
			},
			async reschedule(id, dateISO, vetId) {
				try {
					await api.rescheduleAppointment(id, { dateISO, vetId })
					await refresh()
					show({ title: 'Cita reprogramada', variant: 'success' })
				} catch (e: any) {
					const msg = typeof e?.message === 'string' ? e.message : 'No se pudo reprogramar'
					show({ title: 'Error', description: msg, variant: 'error' })
					throw e
				}
			},
			async cancel(id, by) {
				try {
					await api.cancelAppointment(id, by)
					await refresh()
					show({ title: 'Cita cancelada', variant: 'success' })
				} catch (e: any) {
					const msg = typeof e?.message === 'string' ? e.message : 'No se pudo cancelar'
					show({ title: 'Error', description: msg, variant: 'error' })
					throw e
				}
			}
		}),
		[vets, appointments]
	)
	return <AppointmentsContext.Provider value={value}>{children}</AppointmentsContext.Provider>
}

export function useAppointments() {
	const ctx = useContext(AppointmentsContext)
	if (!ctx) throw new Error('useAppointments must be used within AppointmentsProvider')
	return ctx
}


