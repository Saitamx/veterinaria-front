import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Role, User } from '../types'
import { api, type ApiUser } from '../services/backendApi'

type AuthContextValue = {
	user: User | null
	login: (email: string, password: string) => Promise<boolean>
	logout: () => void
	registerClient: (input: { name: string; email: string; password: string; phone: string }) => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const LS_SESSION = 'pochita_session_v1'

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(() => {
		try {
			const raw = localStorage.getItem(LS_SESSION)
			return raw ? (JSON.parse(raw) as User) : null
		} catch {
			return null
		}
	})

	useEffect(() => {
		if (user) localStorage.setItem(LS_SESSION, JSON.stringify(user))
		else localStorage.removeItem(LS_SESSION)
	}, [user])

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			async login(email, password) {
				const { token, user } = await api.login({ email, password })
				localStorage.setItem('auth_token', token)
				setUser(mapApiUser(user))
				return true
			},
			logout() {
				localStorage.removeItem('auth_token')
				setUser(null)
			},
			async registerClient({ name, email, password, phone }) {
				const { token, user } = await api.register({ name, email, password, phone })
				localStorage.setItem('auth_token', token)
				setUser(mapApiUser(user))
				return true
			}
		}),
		[user]
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error('useAuth must be used within AuthProvider')
	return ctx
}

function mapApiUser(u: ApiUser): User {
	const roleMap: Record<ApiUser['role'], Role> = {
		CLIENTE: 'cliente',
		RECEPCIONISTA: 'recepcionista',
		VETERINARIO: 'veterinario',
		ADMIN: 'admin'
	}
	return { id: u.id, name: u.name, email: u.email, password: '', role: roleMap[u.role], phone: u.phone, clientId: u.id }
}

