import { v4 as uuid } from 'uuid'
import dayjs from 'dayjs'
import {
	type Appointment,
	type Client,
	type FollowUp,
	type ID,
	type Pet,
	type ProcedureType,
	type Product,
	type Reservation,
	type Treatment,
	type Vet
} from '../types'
import { getLocalStorageItem, setLocalStorageItem } from '../utils/storage'

const LATENCY_MS = 500

type DB = {
	clients: Client[]
	pets: Pet[]
	vets: Vet[]
	appointments: Appointment[]
	treatments: Treatment[]
	followUps: FollowUp[]
	products: Product[]
	reservations: Reservation[]
}

const LS_KEY = 'pochita_db_v1'

function seed(): DB {
	const now = dayjs()
	const clients: Client[] = [
		{ id: uuid(), name: 'Juan Pérez', phone: '999-111-222' },
		{ id: uuid(), name: 'María López', phone: '999-333-444' }
	]
	const pets: Pet[] = [
		{ id: uuid(), name: 'Firulais', species: 'Perro', breed: 'Mestizo', ageYears: 4, ownerId: clients[0].id },
		{ id: uuid(), name: 'Mishi', species: 'Gato', breed: 'Siames', ageYears: 2, ownerId: clients[1].id }
	]
	const vets: Vet[] = [
		{ id: uuid(), name: 'Dra. Salazar', specialty: 'General' },
		{ id: uuid(), name: 'Dr. Rojas', specialty: 'Cirugía' }
	]
	const appointments: Appointment[] = [
		{
			id: uuid(),
			clientId: clients[0].id,
			petId: pets[0].id,
			vetId: vets[0].id,
			reason: 'Vacunación anual',
			dateISO: now.add(1, 'day').hour(10).minute(0).second(0).millisecond(0).toISOString(),
			status: 'programada',
			createdAt: now.toISOString()
		}
	]
	const products: Product[] = [
		{ id: uuid(), name: 'Alimento Premium 5kg', price: 120.0, stock: 8 },
		{ id: uuid(), name: 'Antipulgas', price: 35.5, stock: 0 },
		{ id: uuid(), name: 'Vitaminas', price: 22.9, stock: 14 }
	]
	return { clients, pets, vets, appointments, treatments: [], followUps: [], products, reservations: [] }
}

function getDb(): DB {
	return getLocalStorageItem<DB>(LS_KEY, seed())
}

function saveDb(db: DB) {
	setLocalStorageItem(LS_KEY, db)
}

function simulate<T>(result: T, ms = LATENCY_MS): Promise<T> {
	return new Promise((resolve) => setTimeout(() => resolve(result), ms))
}

// Clients & Pets
export async function listClients() {
	return simulate(getDb().clients)
}
export async function upsertClient(input: Omit<Client, 'id'> & Partial<Pick<Client, 'id'>>) {
	const db = getDb()
	if (input.id) {
		db.clients = db.clients.map((c) => (c.id === input.id ? { ...c, ...input } : c))
	} else {
		db.clients.push({ id: uuid(), name: input.name, phone: input.phone })
	}
	saveDb(db)
	return simulate(db.clients)
}
export async function listPets() {
	return simulate(getDb().pets)
}
export async function upsertPet(input: Omit<Pet, 'id'> & Partial<Pick<Pet, 'id'>>) {
	const db = getDb()
	if (input.id) {
		db.pets = db.pets.map((p) => (p.id === input.id ? { ...p, ...input } : p))
	} else {
		db.pets.push({ id: uuid(), ...input } as Pet)
	}
	saveDb(db)
	return simulate(db.pets)
}

// Vets & Appointments
export async function listVets() {
	return simulate(getDb().vets)
}
export function getAvailableSlots(vetId: ID, dateISO: string): string[] {
	// Simplified availability: 09:00-17:00 each hour; remove already booked
	const date = dayjs(dateISO).hour(9).minute(0).second(0).millisecond(0)
	const slots: string[] = []
	for (let h = 9; h <= 17; h++) {
		const slot = date.hour(h).toISOString()
		slots.push(slot)
	}
	const db = getDb()
	const booked = new Set(
		db.appointments.filter((a) => a.vetId === vetId && dayjs(a.dateISO).isSame(dateISO, 'day')).map((a) => dayjs(a.dateISO).toISOString())
	)
	return slots.filter((s) => !booked.has(s))
}
export async function listAppointments() {
	return simulate(getDb().appointments.sort((a, b) => dayjs(a.dateISO).valueOf() - dayjs(b.dateISO).valueOf()))
}
export async function createAppointment(input: Omit<Appointment, 'id' | 'status' | 'createdAt'>) {
	const db = getDb()
	const newApt: Appointment = {
		...input,
		id: uuid(),
		status: 'programada',
		createdAt: new Date().toISOString()
	}
	db.appointments.push(newApt)
	saveDb(db)
	return simulate(newApt)
}
export async function updateAppointment(id: ID, patch: Partial<Appointment>) {
	const db = getDb()
	db.appointments = db.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a))
	saveDb(db)
	return simulate(db.appointments.find((a) => a.id === id)!)
}
export async function cancelAppointment(id: ID) {
	return updateAppointment(id, { status: 'cancelada' })
}
export async function confirmAppointment(id: ID) {
	return updateAppointment(id, { status: 'confirmada' })
}

// Treatments & Follow-ups
export async function createTreatment(input: {
	appointmentId: ID
	procedure: ProcedureType
	approvedByOwner: boolean
	additionalCost?: number
	notes: string
}) {
	const db = getDb()
	const treatment: Treatment = {
		id: uuid(),
		appointmentId: input.appointmentId,
		procedure: input.procedure,
		approvedByOwner: input.approvedByOwner,
		additionalCost: input.additionalCost,
		notes: input.notes,
		createdAt: new Date().toISOString()
	}
	db.treatments.push(treatment)
	saveDb(db)
	return simulate(treatment)
}

export async function listTreatmentsByAppointment(appointmentId: ID) {
	return simulate(getDb().treatments.filter((t) => t.appointmentId === appointmentId))
}

export async function createFollowUps(treatmentId: ID, datesISO: string[]) {
	const db = getDb()
	const items: FollowUp[] = datesISO.map((d) => ({ id: uuid(), treatmentId, dateISO: d, notes: '', completed: false }))
	db.followUps.push(...items)
	saveDb(db)
	return simulate(items)
}
export async function listFollowUps(treatmentId: ID) {
	return simulate(getDb().followUps.filter((f) => f.treatmentId === treatmentId))
}
export async function completeFollowUp(id: ID) {
	const db = getDb()
	db.followUps = db.followUps.map((f) => (f.id === id ? { ...f, completed: true } : f))
	saveDb(db)
	return simulate(db.followUps.find((f) => f.id === id)!)
}

// Products & Reservations
export async function listProducts() {
	return simulate(getDb().products)
}
export async function updateProductStock(productId: ID, delta: number) {
	const db = getDb()
	db.products = db.products.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p))
	saveDb(db)
	return simulate(db.products.find((p) => p.id === productId)!)
}
export async function checkout(cart: { productId: ID; quantity: number }[]) {
	const db = getDb()
	for (const item of cart) {
		db.products = db.products.map((p) =>
			p.id === item.productId ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p
		)
	}
	saveDb(db)
	return simulate(true)
}
export async function createReservation(input: Omit<Reservation, 'id' | 'status' | 'createdAt'>) {
	const db = getDb()
	const reservation: Reservation = {
		...input,
		id: uuid(),
		status: 'pendiente',
		createdAt: new Date().toISOString()
	}
	db.reservations.push(reservation)
	saveDb(db)
	return simulate(reservation)
}
export async function listReservationsByProduct(productId: ID) {
	const db = getDb()
	return simulate(db.reservations.filter((r) => r.productId === productId))
}
export async function updateReservationStatus(reservationId: ID, status: Reservation['status']) {
	const db = getDb()
	db.reservations = db.reservations.map((r) => (r.id === reservationId ? { ...r, status } : r))
	saveDb(db)
	return simulate(db.reservations.find((r) => r.id === reservationId)!)
}


