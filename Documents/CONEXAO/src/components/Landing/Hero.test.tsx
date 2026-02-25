import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Hero from './Hero'

describe('Hero Component', () => {
    it('renders the main headline', () => {
        render(<Hero />)
        const heading = screen.getByRole('heading', { level: 1 })
        expect(heading).toBeInTheDocument()
        expect(heading).toHaveTextContent(/Agente de Vendas/i)
    })

    it('renders the CTA buttons', () => {
        render(<Hero />)
        expect(screen.getByRole('link', { name: /criar meu agente agora/i })).toBeInTheDocument()
    })

    it('mentions ElevenLabs', () => {
        render(<Hero />)
        expect(screen.getByText(/Powered by ElevenLabs/i)).toBeInTheDocument()
    })
})
