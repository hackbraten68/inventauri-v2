import { prisma } from '../prisma';

export interface SetupStatus {
    hasShops: boolean;
    hasSuperAdmin: boolean;
    isInitialized: boolean;
}

/**
 * Checks if the application is fully setup.
 * Onboarding is triggered if no shops or owners exist.
 */
export async function getSetupStatus(): Promise<SetupStatus> {
    const [shopCount, ownerCount] = await Promise.all([
        prisma.shop.count(),
        prisma.userShop.count({ where: { role: 'owner' } })
    ]);

    const hasShops = shopCount > 0;
    const hasOwner = ownerCount > 0;

    return {
        hasShops,
        hasSuperAdmin: hasOwner, // Mapping owner as the primary admin for status check
        isInitialized: hasShops && hasOwner
    };
}
