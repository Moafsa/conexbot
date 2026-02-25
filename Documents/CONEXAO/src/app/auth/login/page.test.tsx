import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from './page'

// Mock next-auth
jest.mock('next-auth/react', () => ({
    signIn: jest.fn(),
    SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock useRouter and useSearchParams
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({ push: jest.fn(), refresh: jest.fn() })),
    useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
}))

import { signIn } from 'next-auth/react'

describe('LoginPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders the login form with email and password fields', () => {
        render(<LoginPage />)
        expect(screen.getByPlaceholderText('joao@empresa.com')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Sua senha')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument()
    })

    it('shows link to register page', () => {
        render(<LoginPage />)
        expect(screen.getByText('Criar conta grátis')).toBeInTheDocument()
    })

    it('submits the form with email and password', async () => {
        (signIn as jest.Mock).mockResolvedValue({ error: null })

        render(<LoginPage />)

        fireEvent.change(screen.getByPlaceholderText('joao@empresa.com'), {
            target: { value: 'test@example.com' }
        })
        fireEvent.change(screen.getByPlaceholderText('Sua senha'), {
            target: { value: 'password123' }
        })

        fireEvent.click(screen.getByRole('button', { name: /Entrar/i }))

        await waitFor(() => {
            expect(signIn).toHaveBeenCalledWith('credentials', {
                email: 'test@example.com',
                password: 'password123',
                redirect: false,
            })
        })
    })

    it('shows error on invalid credentials', async () => {
        (signIn as jest.Mock).mockResolvedValue({ error: 'CredentialsSignin' })

        render(<LoginPage />)

        fireEvent.change(screen.getByPlaceholderText('joao@empresa.com'), {
            target: { value: 'wrong@email.com' }
        })
        fireEvent.change(screen.getByPlaceholderText('Sua senha'), {
            target: { value: 'wrongpass' }
        })

        fireEvent.click(screen.getByRole('button', { name: /Entrar/i }))

        await waitFor(() => {
            expect(screen.getByText('Email ou senha incorretos.')).toBeInTheDocument()
        })
    })

    it('shows success message after registration', () => {
        const { useSearchParams } = require('next/navigation')
        useSearchParams.mockReturnValue({ get: (key: string) => key === 'registered' ? 'true' : null })

        render(<LoginPage />)
        expect(screen.getByText(/Conta criada com sucesso/i)).toBeInTheDocument()
    })
})
