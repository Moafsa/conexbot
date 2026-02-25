
export const StripeService = {
    async createSession(customerData: any, plan: string) {
        // Mock Implementation
        return {
            id: "cs_test_" + Math.random().toString(36).substr(7),
            url: "/billing/success?gateway=stripe&status=paid"
        };
    }
};
