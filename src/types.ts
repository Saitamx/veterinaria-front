export type ID = string

export type Role = 'cliente' | 'recepcionista' | 'veterinario' | 'admin'

export type Client = {
	id: ID
	name: string
	phone: string
}

export type Pet = {
	id: ID
	name: string
	species: 'Perro' | 'Gato' | 'Otro'
	breed?: string
	ageYears?: number
	ownerId: ID
}

export type Vet = {
	id: ID
	name: string
	specialty?: string
}

export type AppointmentStatus = 'programada' | 'confirmada' | 'completada' | 'cancelada'

export type Appointment = {
	id: ID
	clientId: ID
	petId: ID
	vetId: ID
	reason: string
	dateISO: string
	status: AppointmentStatus
	createdAt: string
}

export type WaitlistItem = {
	id: ID
	clientId: ID
	petName: string
	petSpecies?: Pet['species']
	preferredVetId?: ID
	notes?: string
	createdAt: string
}

export type ProcedureType = 'Vacunación' | 'Desparasitación' | 'Cirugía menor'

export type Treatment = {
	id: ID
	appointmentId: ID
	procedure: ProcedureType
	approvedByOwner: boolean
	additionalCost?: number
	notes: string
	createdAt: string
}

export type User = {
	id: ID
	name: string
	email: string
	password: string
	role: Role
	clientId?: ID
	phone?: string
}

export type FollowUp = {
	id: ID
	treatmentId: ID
	dateISO: string
	notes?: string
	completed: boolean
}

export type Product = {
	id: ID
	name: string
	price: number
	stock: number
}

export type Reservation = {
	id: ID
	productId: ID
	clientName: string
	phone: string
	status: 'pendiente' | 'notificado' | 'aceptado' | 'liberado' | 'rechazado'
	createdAt: string
}


