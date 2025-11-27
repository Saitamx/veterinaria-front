import { useMemo, useState } from 'react'
import { usePets } from '../../contexts/PetsContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

export function PetsPage() {
	const { clients, pets, saveClient, savePet } = usePets()
	const [clientForm, setClientForm] = useState({ name: '', phone: '' })
	const [petForm, setPetForm] = useState({ ownerId: '', name: '', species: 'Perro', breed: '', ageYears: '' })

	const petsByOwner = useMemo(() => {
		const map: Record<string, number> = {}
		for (const p of pets) map[p.ownerId] = (map[p.ownerId] ?? 0) + 1
		return map
	}, [pets])

	return (
		<div className="space-y-6">
			<h1 className="text-xl font-semibold">Mascotas y clientes</h1>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="card p-5">
					<h2 className="font-semibold mb-3">Registrar cliente</h2>
					<div className="space-y-3">
						<Input placeholder="Nombre completo" value={clientForm.name} onChange={(e) => setClientForm((f) => ({ ...f, name: e.target.value }))} />
						<Input placeholder="Teléfono" value={clientForm.phone} onChange={(e) => setClientForm((f) => ({ ...f, phone: e.target.value }))} />
						<Button onClick={() => saveClient(clientForm as any)}>Guardar</Button>
					</div>
				</div>
				<div className="card p-5 lg:col-span-2">
					<h2 className="font-semibold mb-3">Registrar mascota</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Select value={petForm.ownerId} onChange={(e) => setPetForm((f) => ({ ...f, ownerId: e.target.value }))}>
							<option value="">Dueño</option>
							{clients.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name} ({c.phone})
								</option>
							))}
						</Select>
						<Input placeholder="Nombre de la mascota" value={petForm.name} onChange={(e) => setPetForm((f) => ({ ...f, name: e.target.value }))} />
						<Select value={petForm.species} onChange={(e) => setPetForm((f) => ({ ...f, species: e.target.value }))}>
							<option>Perro</option>
							<option>Gato</option>
							<option>Otro</option>
						</Select>
						<Input placeholder="Raza" value={petForm.breed} onChange={(e) => setPetForm((f) => ({ ...f, breed: e.target.value }))} />
						<Input placeholder="Edad (años)" type="number" value={petForm.ageYears} onChange={(e) => setPetForm((f) => ({ ...f, ageYears: e.target.value }))} />
						<div className="sm:col-span-2">
							<Button onClick={() => savePet({ ...petForm, ageYears: petForm.ageYears ? parseInt(petForm.ageYears) : undefined } as any)} disabled={!petForm.ownerId}>
								Guardar mascota
							</Button>
						</div>
					</div>
				</div>
			</div>
			<div className="card p-5">
				<h2 className="font-semibold mb-3">Listado</h2>
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead className="bg-gray-50 text-gray-700">
							<tr>
								<th className="px-4 py-2 text-left">Dueño</th>
								<th className="px-4 py-2 text-left">Mascotas</th>
								<th className="px-4 py-2 text-left">Teléfono</th>
							</tr>
						</thead>
						<tbody>
							{clients.map((c) => (
								<tr key={c.id} className="border-t">
									<td className="px-4 py-2">{c.name}</td>
									<td className="px-4 py-2">{petsByOwner[c.id] ?? 0}</td>
									<td className="px-4 py-2">{c.phone}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}


