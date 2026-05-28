import prisma from "./prisma";

export async function getDynamicAgencyFee(agency: { salesVolumeCurrentMonth: number; currentFee: number }): Promise<number> {
    const tiers = await prisma.agencyTier.findMany({
        orderBy: { minSalesVolume: 'asc' }
    });

    if (tiers.length === 0) {
        return agency.currentFee;
    }

    let currentTier = null;
    const currentVolume = agency.salesVolumeCurrentMonth || 0;

    for (let i = 0; i < tiers.length; i++) {
        if (currentVolume >= tiers[i].minSalesVolume) {
            currentTier = tiers[i];
        } else {
            break;
        }
    }

    if (currentTier) {
        return currentTier.feePercentage;
    }

    // Se estiver abaixo do primeiro nível (Iniciante), utiliza a taxa do primeiro tier cadastrado (Starter)
    return tiers[0].feePercentage;
}
