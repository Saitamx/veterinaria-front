import { ReactNode } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { AppointmentsProvider } from '../contexts/AppointmentsContext'
import { ToastContainer } from '../components/ui/Toast'

export function AppProviders({ children }: { children: ReactNode }) {
	return (
		<AuthProvider>
			<ToastProvider>
				<AppointmentsProvider>
					{children}
					<ToastContainer />
				</AppointmentsProvider>
			</ToastProvider>
		</AuthProvider>
	)
}


