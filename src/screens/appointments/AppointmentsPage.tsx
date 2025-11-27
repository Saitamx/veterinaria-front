import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useAppointments } from '../../contexts/AppointmentsContext'
import { api } from '../../services/backendApi'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import type { Appointment } from '../../types'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function AppointmentsPage() {
	const { appointments, vets, cancel, reschedule } = useAppointments()
	const { user } = useAuth()
	const [open, setOpen] = useState(false)
	const [editing, setEditing] = useState<Appointment | null>(null)
	const [form, setForm] = useState({
		vetId: '',
		date: dayjs().format('YYYY-MM-DD'),
		slot: '',
		reason: ''
	})
	const [slots, setSlots] = useState<string[]>([])

	// Crear cita (admin/recepción)
	const [createOpen, setCreateOpen] = useState(false)
	const [cform, setCform] = useState({ userEmail: '', vetId: '', date: dayjs().format('YYYY-MM-DD'), slot: '', reason: '' })
	const [cslots, setCslots] = useState<string[]>([])
	const [cerrors, setCErrors] = useState<{ userEmail?: string; vetId?: string; date?: string; slot?: string; reason?: string }>({})

	useEffect(() => {
		if (form.vetId && form.date) {
			api.slots(form.vetId, dayjs(form.date).format('YYYY-MM-DD')).then(setSlots)
			setForm((f) => ({ ...f, slot: '' }))
		}
	}, [form.vetId, form.date])
	useEffect(() => {
		if (cform.vetId && cform.date) {
			api.slots(cform.vetId, dayjs(cform.date).format('YYYY-MM-DD')).then(setCslots)
			setCform((f) => ({ ...f, slot: '' }))
		}
	}, [cform.vetId, cform.date])

	const data = useMemo(
		() =>
			appointments.map((a: any) => ({
				...a,
				vetName: vets.find((v) => v.id === a.vetId)?.name ?? '—',
				clientName: a.user?.name ?? '—',
				contact: a.user?.phone || a.user?.email || '—'
			})),
		[appointments, vets]
	)

	function openNew() {
		setEditing(null)
		// Solo reprogramación: no creamos nuevas citas desde recepción (alcance acotado)
		setForm({ vetId: vets[0]?.id ?? '', date: dayjs().format('YYYY-MM-DD'), slot: '', reason: '' })
		setOpen(true)
	}
	function openEdit(a: Appointment) {
		setEditing(a)
		setForm((f) => ({
			...f,
			vetId: (a as any).vetId,
			date: dayjs((a as any).dateTime).format('YYYY-MM-DD'),
			slot: (a as any).dateTime
		}))
		setOpen(true)
	}

	async function submit() {
		if (!form.vetId || !form.slot || !editing) return
		if (!confirm('¿Confirmas reprogramar esta cita?')) return
		await reschedule(editing.id as any, form.slot, form.vetId)
		setOpen(false)
	}

	function openCreate() {
		setCform({ userEmail: '', vetId: vets[0]?.id ?? '', date: dayjs().format('YYYY-MM-DD'), slot: '', reason: '' })
		setCErrors({})
		setCreateOpen(true)
	}
	async function submitCreate() {
		const e: typeof cerrors = {}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cform.userEmail)) e.userEmail = 'Correo inválido'
		if (!cform.vetId) e.vetId = 'Selecciona veterinario'
		if (!cform.date) e.date = 'Selecciona fecha'
		if (!cform.slot) e.slot = 'Selecciona horario'
		if (!cform.reason || cform.reason.trim().length < 3) e.reason = 'Motivo mínimo 3 caracteres'
		setCErrors(e)
		if (Object.keys(e).length > 0) return
		if (!confirm('¿Crear nueva cita para este cliente?')) return
		await api.manageCreateAppointment({ ...cform })
		setCreateOpen(false)
		// refresco simple recargando página actual de citas al cerrar modal
		location.reload()
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">Citas</h1>
				<div className="flex gap-2">
					<Button onClick={openNew}>Reprogramar cita</Button>
					{(user?.role === 'admin' || user?.role === 'recepcionista') && <Button onClick={openCreate}>Nueva cita</Button>}
				</div>
			</div>

			<div className="card overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead className="bg-gray-50 text-gray-700">
							<tr>
								<th className="px-4 py-2 text-left">Fecha</th>
								<th className="px-4 py-2 text-left">Cliente</th>
								<th className="px-4 py-2 text-left">Contacto</th>
								<th className="px-4 py-2 text-left">Veterinario</th>
								<th className="px-4 py-2 text-left">Estado</th>
								<th className="px-4 py-2"></th>
							</tr>
						</thead>
						<tbody>
							{data.map((a) => (
								<tr key={a.id} className="border-t">
									<td className="px-4 py-2 whitespace-nowrap">{dayjs((a as any).dateTime).format('DD/MM/YYYY HH:mm')}</td>
									<td className="px-4 py-2">{(a as any).clientName}</td>
									<td className="px-4 py-2">{(a as any).contact}</td>
									<td className="px-4 py-2">{(a as any).vetName}</td>
									<td className="px-4 py-2 capitalize">{(a as any).status.toLowerCase()}</td>
									<td className="px-4 py-2">
										<div className="flex gap-2">
											<Button variant="outline" onClick={() => openEdit(a)}>
												Cambiar
											</Button>
											<Button variant="outline" onClick={() => { if (confirm('¿Seguro que deseas cancelar esta cita?')) cancel(a.id as any, 'client') }}>
												Cancelar
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<Modal
				title={'Reprogramar cita'}
				open={open}
				onClose={() => setOpen(false)}
				footer={
					<div className="flex items-center justify-end gap-2">
						<Button variant="outline" onClick={() => setOpen(false)}>
							Cancelar
						</Button>
						<Button onClick={() => { if (confirm('¿Confirmas reprogramar esta cita?')) submit() }}>Guardar</Button>
					</div>
				}
			>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<Select label="Veterinario" value={form.vetId} onChange={(e) => setForm((f) => ({ ...f, vetId: e.target.value }))}>
						<option value="" disabled>
							Selecciona...
						</option>
						{vets.map((v) => (
							<option key={v.id} value={v.id}>
								{v.name}
							</option>
						))}
					</Select>
					<Input
						label="Fecha"
						type="date"
						value={form.date}
						onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
					/>
					<Select
						label="Horario disponible"
						value={form.slot}
						onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value }))}
					>
						<option value="">Selecciona horario</option>
						{slots.map((s) => (
							<option key={s} value={s}>
								{dayjs(s).format('HH:mm')}
							</option>
						))}
					</Select>
				</div>
			</Modal>

			<Modal
				title={'Nueva cita'}
				open={createOpen}
				onClose={() => setCreateOpen(false)}
				footer={
					<div className="flex items-center justify-end gap-2">
						<Button variant="outline" onClick={() => setCreateOpen(false)}>
							Cancelar
						</Button>
						<Button onClick={submitCreate}>Crear</Button>
					</div>
				}
			>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<Input label="Correo del cliente" value={cform.userEmail} onChange={(e) => setCform((f) => ({ ...f, userEmail: e.target.value }))} error={cerrors.userEmail} />
					<Select label="Veterinario" value={cform.vetId} onChange={(e) => setCform((f) => ({ ...f, vetId: e.target.value }))} error={cerrors.vetId}>
						<option value="" disabled>Selecciona...</option>
						{vets.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
					</Select>
					<Input label="Fecha" type="date" value={cform.date} onChange={(e) => setCform((f) => ({ ...f, date: e.target.value }))} error={cerrors.date} />
					<Select label="Horario" value={cform.slot} onChange={(e) => setCform((f) => ({ ...f, slot: e.target.value }))} error={cerrors.slot}>
						<option value="">Selecciona horario</option>
						{cslots.map((s) => (<option key={s} value={s}>{dayjs(s).format('HH:mm')}</option>))}
					</Select>
					<div className="sm:col-span-2">
						<Input label="Motivo" value={cform.reason} onChange={(e) => setCform((f) => ({ ...f, reason: e.target.value }))} error={cerrors.reason} />
					</div>
				</div>
			</Modal>
		</div>
	)
}


