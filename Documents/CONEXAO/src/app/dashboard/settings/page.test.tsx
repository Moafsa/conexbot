import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from './page';

// Mock next-auth
jest.mock('next-auth/react', () => ({
    useSession: jest.fn(() => ({
        data: { user: { name: 'Test User', email: 'test@test.com' } },
        update: jest.fn()
    })),
}));

// Mock useRouter
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('SettingsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the tabs sidebar', () => {
        render(<SettingsPage />);
        expect(screen.getByText('Perfil')).toBeInTheDocument();
        expect(screen.getByText('Conexão WhatsApp')).toBeInTheDocument();
        expect(screen.getByText('Notificações')).toBeInTheDocument();
        expect(screen.getByText('Segurança')).toBeInTheDocument();
    });

    it('loads profile data on mount', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ name: 'API User', email: 'api@test.com', whatsapp: '123456789' }),
        });

        render(<SettingsPage />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('API User')).toBeInTheDocument();
        });
    });

    it('switches tabs correctly', async () => {
        // Initial profile fetch
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ name: 'User', email: 'email@test.com' }),
        });

        render(<SettingsPage />);

        // Mock response for Notifications tab fetch
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ email: true, whatsapp: false, marketing: true }),
        });

        fireEvent.click(screen.getByText('Notificações'));

        await waitFor(() => {
            expect(screen.getByText('Preferências de Notificação')).toBeInTheDocument();
        });
    });

    it('updates profile calls API', async () => {
        // Initial fetch
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ name: 'Original Name', email: 'test@test.com', whatsapp: '' }),
        });

        // Update response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ name: 'New Name', email: 'test@test.com', whatsapp: '' }),
        });

        render(<SettingsPage />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('Original Name')).toBeInTheDocument();
        });

        const nameInput = screen.getByDisplayValue('Original Name');
        fireEvent.change(nameInput, { target: { value: 'New Name' } });

        const saveButton = screen.getByText('Salvar Alterações');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/settings/profile', expect.objectContaining({
                method: 'PUT',
                body: expect.stringContaining('New Name')
            }));
        });
    });
});
