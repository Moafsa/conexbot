import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

/**
 * Resolves the tenant ID that should be used for the current request.
 * Supports:
 * 1. Admin impersonation via 'impersonate_id' cookie.
 * 2. Agency client management via 'clientId' parameter (requires verification).
 * 3. Default to the current logged-in user's tenant ID.
 */
export async function getEffectiveTenantId(requestedClientId?: string | null) {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.id) return null;

    const currentUserId = session.user.id;
    const currentUserRole = session.user.role;

    // 1. Admin Impersonation (Global)
    if (currentUserRole === "ADMIN" || currentUserRole === "SUPERADMIN") {
        const impersonateId = requestedClientId || (await cookies()).get("impersonate_id")?.value;
        if (impersonateId) return impersonateId;
    }

    // 2. Agency Client Management
    if (currentUserRole === "AGENCY") {
        const clientId = requestedClientId || (await cookies()).get("selected_client_id")?.value;
        
        if (clientId && clientId !== currentUserId) {
            // Verify if this agency actually manages this client
            const agency = await prisma.agency.findUnique({
                where: { tenantId: currentUserId },
                select: { id: true }
            });

            if (agency) {
                const client = await prisma.tenant.findFirst({
                    where: { id: clientId, agencyId: agency.id },
                    select: { id: true }
                });

                if (client) return client.id;
            }
        }
    }

    return currentUserId;
}
