const ASAAS_PROD = 'https://api.asaas.com/v3';
const ASAAS_SANDBOX = 'https://sandbox.asaas.com/api/v3';

function getAsaasBase() {
    return process.env.ASAAS_MODE === 'production' ? ASAAS_PROD : ASAAS_SANDBOX;
}

function getHeaders(customKey?: string): Record<string, string> {
    const key = customKey || process.env.ASAAS_API_KEY;
    if (!key) throw new Error('ASAAS_API_KEY not configured');
    return {
        'Content-Type': 'application/json',
        'access_token': key,
    };
}

const PLAN_VALUES: Record<string, number> = {
    starter: 97,
    pro: 197,
    enterprise: 497,
};

export const AsaasService = {
    async createCustomer(data: { name: string; email: string; cpfCnpj: string }) {
        if (!process.env.ASAAS_API_KEY) {
            console.warn('ASAAS_API_KEY missing, returning mock customer');
            return { id: `cus_mock_${Date.now()}`, ...data };
        }

        const res = await fetch(`${getAsaasBase()}/customers`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                name: data.name,
                email: data.email,
                cpfCnpj: data.cpfCnpj,
            }),
        });

        if (!res.ok) {
            const error = await res.json();
            console.error('Asaas createCustomer error:', error);
            throw new Error(error.errors?.[0]?.description || 'Failed to create customer');
        }

        return res.json();
    },

    async createSubscription(customerId: string, plan: string) {
        const value = PLAN_VALUES[plan] || 97;

        if (!process.env.ASAAS_API_KEY) {
            return {
                id: `sub_mock_${Date.now()}`,
                status: 'PENDING',
                invoiceUrl: `/billing/success?gateway=asaas&status=pending`,
            };
        }

        const res = await fetch(`${getAsaasBase()}/subscriptions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                customer: customerId,
                billingType: 'UNDEFINED', // Allows PIX, boleto, credit card
                value,
                cycle: 'MONTHLY',
                description: `Conext Bot - Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
                externalReference: customerId,
            }),
        });

        if (!res.ok) {
            const error = await res.json();
            console.error('Asaas createSubscription error:', error);
            throw new Error(error.errors?.[0]?.description || 'Failed to create subscription');
        }

        const subscription = await res.json();

        return {
            id: subscription.id,
            status: subscription.status,
            invoiceUrl: subscription.invoiceUrl || `/billing/success?gateway=asaas&id=${subscription.id}`,
        };
    },

    async createPaymentLink(params: {
        apiKey: string;
        customerName: string;
        customerEmail: string;
        customerPhone: string;
        amount: number; // in cents (e.g., 5000 = R$ 50.00)
        description: string;
    }): Promise<{ success: boolean; url?: string; error?: string }> {
        try {
            // Create or get customer first
            const customerRes = await fetch(`${getAsaasBase()}/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': params.apiKey,
                },
                body: JSON.stringify({
                    name: params.customerName,
                    email: params.customerEmail,
                    mobilePhone: params.customerPhone,
                }),
            });

            let customerId: string;
            if (customerRes.ok) {
                const customer = await customerRes.json();
                customerId = customer.id;
            } else {
                // Try to find existing customer by email
                const searchRes = await fetch(
                    `${getAsaasBase()}/customers?email=${encodeURIComponent(params.customerEmail)}`,
                    {
                        headers: { 'access_token': params.apiKey },
                    }
                );

                if (!searchRes.ok) {
                    return { success: false, error: 'Failed to create/find customer' };
                }

                const searchData = await searchRes.json();
                if (!searchData.data || searchData.data.length === 0) {
                    return { success: false, error: 'Customer creation failed' };
                }
                customerId = searchData.data[0].id;
            }

            // Create payment
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7); // 7 days from now

            const paymentRes = await fetch(`${getAsaasBase()}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': params.apiKey,
                },
                body: JSON.stringify({
                    customer: customerId,
                    billingType: 'UNDEFINED',
                    value: params.amount / 100, // Convert cents to reais
                    dueDate: dueDate.toISOString().split('T')[0],
                    description: params.description,
                }),
            });

            if (!paymentRes.ok) {
                // MOCK MODE FOR DEV
                if (!params.apiKey || params.apiKey === 'mock_key') {
                    console.log('[Asaas] Using Mock Payment for Dev');
                    return {
                        success: true,
                        url: `https://sandbox.asaas.com/money/pay/mock-${Date.now()}`
                    };
                }

                const error = await paymentRes.json();
                console.error('[Asaas] Payment creation error:', error);
                return {
                    success: false,
                    error: error.errors?.[0]?.description || 'Payment creation failed',
                };
            }

            const payment = await paymentRes.json();
            return {
                success: true,
                url: payment.invoiceUrl || payment.bankSlipUrl,
            };
        } catch (error) {
            console.error('[Asaas] createPaymentLink error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },
};
