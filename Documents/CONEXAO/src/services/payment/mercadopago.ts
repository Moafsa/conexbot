const PLAN_VALUES: Record<string, number> = {
    starter: 97,
    pro: 197,
    enterprise: 497,
};

export const MercadoPagoService = {
    async createPreference(customerData: { name?: string | null; email: string }, plan: string) {
        const value = PLAN_VALUES[plan] || 97;
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

        if (!accessToken) {
            console.warn('MERCADOPAGO_ACCESS_TOKEN missing, returning mock');
            return {
                id: `pref_mock_${Date.now()}`,
                url: `/billing/success?gateway=mercadopago&status=approved`,
            };
        }

        const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                items: [{
                    title: `Conext Bot - Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
                    unit_price: value,
                    quantity: 1,
                    currency_id: 'BRL',
                }],
                payer: {
                    name: customerData.name || 'Cliente',
                    email: customerData.email,
                },
                back_urls: {
                    success: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?gateway=mercadopago`,
                    failure: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=payment_failed`,
                    pending: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?gateway=mercadopago&status=pending`,
                },
                auto_return: 'approved',
                notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
                external_reference: customerData.email,
            }),
        });

        if (!res.ok) {
            const error = await res.json();
            console.error('MercadoPago error:', error);
            throw new Error('Failed to create MercadoPago preference');
        }

        const preference = await res.json();

        return {
            id: preference.id,
            url: preference.init_point,
        };
    },
};
