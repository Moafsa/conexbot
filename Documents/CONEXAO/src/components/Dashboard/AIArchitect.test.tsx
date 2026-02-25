import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AIArchitect from './AIArchitect'

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({ push: jest.fn() })),
    useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
}))

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn()

// Mock fetch
global.fetch = jest.fn()

describe('AIArchitect', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                content: 'Que nome você gostaria para o seu agente?',
                nextStep: 'collect_name',
                extractedData: {},
            }),
        })
    })

    it('renders the initial greeting', () => {
        render(<AIArchitect />)
        expect(screen.getByText(/Vamos criar seu atendente inteligente/i)).toBeInTheDocument()
    })

    it('renders the input field and send button', () => {
        render(<AIArchitect />)
        expect(screen.getByPlaceholderText('Digite aqui...')).toBeInTheDocument()
        expect(screen.getByText('➤')).toBeInTheDocument()
    })

    it('sends user message and shows it in chat', async () => {
        render(<AIArchitect />)

        const input = screen.getByPlaceholderText('Digite aqui...')
        fireEvent.change(input, { target: { value: 'Pizzaria do Zé' } })
        fireEvent.click(screen.getByText('➤'))

        expect(screen.getByText('Pizzaria do Zé')).toBeInTheDocument()
    })

    it('calls API and displays AI response', async () => {
        render(<AIArchitect />)

        const input = screen.getByPlaceholderText('Digite aqui...')
        fireEvent.change(input, { target: { value: 'Pizzaria do Zé' } })
        fireEvent.click(screen.getByText('➤'))

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/ai/architect', expect.objectContaining({
                method: 'POST',
            }))
        })

        await waitFor(() => {
            expect(screen.getByText(/Que nome você gostaria/i)).toBeInTheDocument()
        })
    })

    it('shows error message on API failure', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

        render(<AIArchitect />)

        const input = screen.getByPlaceholderText('Digite aqui...')
        fireEvent.change(input, { target: { value: 'teste' } })
        fireEvent.click(screen.getByText('➤'))

        await waitFor(() => {
            expect(screen.getByText('Erro de conexão com a IA.')).toBeInTheDocument()
        })
    })

    it('does not send empty messages', () => {
        render(<AIArchitect />)

        fireEvent.click(screen.getByText('➤'))

        expect(global.fetch).not.toHaveBeenCalled()
    })
})
