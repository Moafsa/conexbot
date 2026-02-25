import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import FinancePage from './page';

global.fetch = jest.fn();

describe('FinancePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders loading state initially', () => {
        (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => { })); // Never resolves
        render(<FinancePage />);
    });

    it('renders subscription and payment data', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                subscription: { plan: 'pro', status: 'active' },
                payments: [
                    { id: '1', amount: 97.00, status: 'paid', gateway: 'asaas', createdAt: '2023-01-01' }
                ],
                usage: { messagesUsed: 100, messagesLimit: 1000 }
            }),
        });

        render(<FinancePage />);

        await waitFor(() => {
            expect(screen.getByText('Pro')).toBeInTheDocument();
            expect(screen.getByText('R$ 97,00')).toBeInTheDocument();
            expect(screen.getByText('Pago')).toBeInTheDocument();
        });
    });

    it('handles empty payments', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                subscription: { plan: 'starter', status: 'active' },
                payments: []
            }),
        });

        render(<FinancePage />);

        await waitFor(() => {
            expect(screen.getByText('Nenhum pagamento registrado ainda.')).toBeInTheDocument();
        });
    });
});
