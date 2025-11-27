import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useAppointments } from '../../contexts/AppointmentsContext'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { api } from '../../services/backendApi'

export function ClientDashboard() {
	const { user } = useAuth()
	const { appointments, vets, reschedule, cancel } = useAppointments()
	const myApts = useMemo(() => appointments.filter((a) => a.userId === user?.id), [appointments, user?.id])

	const [open, setOpen] = useState(false)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [form, setForm] = useState({ vetId: '', date: dayjs().format('YYYY-MM-DD'), slot: '' })
	const [slots, setSlots] = useState<string[]>([])

	useEffect(() => {
		async function loadSlots() {
			if (form.vetId && form.date) {
				const s = await api.slots(form.vetId, form.date)
				setSlots(s)
				setForm((f) => ({ ...f, slot: '' }))
			}
		}
		loadSlots()
	}, [form.vetId, form.date])

	function openReschedule(apt: any) {
		setEditingId(apt.id)
		setForm({
			vetId: apt.vetId,
			date: dayjs(apt.dateTime).format('YYYY-MM-DD'),
			slot: apt.dateTime
		})
		setOpen(true)
	}

	async function submit() {
		if (!editingId || !form.vetId || !form.slot) return
		await reschedule(editingId, form.slot, form.vetId)
		setOpen(false)
	}

	const rows = myApts.map((a: any) => ({
		...a,
		when: dayjs(a.dateTime).format('DD/MM/YYYY HH:mm'),
		vetName: vets.find((v) => v.id === a.vetId)?.name ?? '—',
		statusLabel: String(a.status).toLowerCase()
	}))
	return (
		<div className="space-y-6">
			<h1 className="text-xl font-semibold">Mis citas</h1>
			<div className="card overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead className="bg-gray-50 text-gray-700">
							<tr>
								<th className="px-4 py-2 text-left">Fecha</th>
								<th className="px-4 py-2 text-left">Veterinario</th>
								<th className="px-4 py-2 text-left">Estado</th>
								<th className="px-4 py-2"></th>
							</tr>
						</thead>
						<tbody>
							{rows.map((a) => (
								<tr key={a.id} className="border-t">
									<td className="px-4 py-2 whitespace-nowrap">{a.when}</td>
									<td className="px-4 py-2">{a.vetName}</td>
									<td className="px-4 py-2 capitalize">{a.statusLabel}</td>
									<td className="px-4 py-2">
										<div className="flex gap-2">
											<Button variant="outline" onClick={() => openReschedule(a)}>
												Reprogramar
											</Button>
											<Button variant="outline" onClick={() => cancel(a.id, 'client')}>
												Cancelar
											</Button>
										</div>
									</td>
								</tr>
							))}
							{myApts.length === 0 ? (
								<tr>
									<td className="px-4 py-6 text-sm text-gray-600" colSpan={4}>
										No tienes citas registradas. <Link to="/" className="text-primary-600">Reserva aquí</Link>.
									</td>
								</tr>
							) : null}
						</tbody>
					</table>
				</div>
			</div>

			<Modal
				title="Reprogramar cita"
				open={open}
				onClose={() => setOpen(false)}
				footer={
					<div className="flex items-center justify-end gap-2">
						<Button variant="outline" onClick={() => setOpen(false)}>
							Cerrar
						</Button>
						<Button onClick={submit} disabled={!form.slot}>
							Guardar
						</Button>
					</div>
				}
			>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<Select
						label="Veterinario"
						value={form.vetId}
						onChange={(e) => setForm((f) => ({ ...f, vetId: e.target.value }))}
					>
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
						hint={slots.length === 0 ? 'No hay horarios en este día' : undefined}
					>
						<option value="" disabled>
							Selecciona horario
						</option>
						{slots.map((s) => (
							<option key={s} value={s}>
								{dayjs(s).format('HH:mm')}
							</option>
						))}
					</Select>
				</div>
			</Modal>
		</div>
	)
}


