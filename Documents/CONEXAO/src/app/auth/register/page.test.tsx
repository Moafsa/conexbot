import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegisterPage from './page'

// Mock useRouter
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({ push: jest.fn() })),
}))

// Mock fetch
global.fetch = jest.fn()

describe('RegisterPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders the registration form', () => {
        render(<RegisterPage />)
        expect(screen.getByPlaceholderText('João Silva')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('joao@empresa.com')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Mínimo 6 caracteres')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Criar Minha Conta/i })).toBeInTheDocument()
    })

    it('shows link to login page', () => {
        render(<RegisterPage />)
        expect(screen.getByText('Fazer login')).toBeInTheDocument()
    })

    it('submits form and redirects on success', async () => {
        const pushMock = jest.fn()
        const { useRouter } = require('next/navigation')
        useRouter.mockReturnValue({ push: pushMock });

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ id: '123', email: 'test@test.com' }),
        })

        render(<RegisterPage />)

        fireEvent.change(screen.getByPlaceholderText('João Silva'), {
            target: { value: 'Test User' }
        })
        fireEvent.change(screen.getByPlaceholderText('joao@empresa.com'), {
            target: { value: 'test@test.com' }
        })
        fireEvent.change(screen.getByPlaceholderText('Mínimo 6 caracteres'), {
            target: { value: 'password123' }
        })

        fireEvent.click(screen.getByRole('button', { name: /Criar Minha Conta/i }))

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
                method: 'POST',
            }))
        })

        await waitFor(() => {
            expect(pushMock).toHaveBeenCalledWith('/auth/login?registered=true')
        })
    })

    it('shows error on duplicate email', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ error: 'Este email já está cadastrado' }),
        })

        render(<RegisterPage />)

        fireEvent.change(screen.getByPlaceholderText('João Silva'), {
            target: { value: 'Test' }
        })
        fireEvent.change(screen.getByPlaceholderText('joao@empresa.com'), {
            target: { value: 'existing@test.com' }
        })
        fireEvent.change(screen.getByPlaceholderText('Mínimo 6 caracteres'), {
            target: { value: 'password123' }
        })

        fireEvent.click(screen.getByRole('button', { name: /Criar Minha Conta/i }))

        await waitFor(() => {
            expect(screen.getByText('Este email já está cadastrado')).toBeInTheDocument()
        })
    })

    it('shows error on network failure', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

        render(<RegisterPage />)

        fireEvent.change(screen.getByPlaceholderText('João Silva'), {
            target: { value: 'Test' }
        })
        fireEvent.change(screen.getByPlaceholderText('joao@empresa.com'), {
            target: { value: 'test@test.com' }
        })
        fireEvent.change(screen.getByPlaceholderText('Mínimo 6 caracteres'), {
            target: { value: 'password123' }
        })

        fireEvent.click(screen.getByRole('button', { name: /Criar Minha Conta/i }))

        await waitFor(() => {
            expect(screen.getByText('Erro de conexão. Tente novamente.')).toBeInTheDocument()
        })
    })
})
