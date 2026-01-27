import { prisma } from '../prisma';

export interface SetupStatus {
    hasShops: boolean;
    hasSuperAdmin: boolean;
    isInitialized: boolean;
}

/**
 * Checks if the application is fully setup.
 * Self-hosting onboarding is triggered if no shops or super-admins exist.
 */
export async function getSetupStatus(): Promise<SetupStatus> {
    const [shopCount, userShopCount, superAdminCount] = await Promise.all([
        prisma.shop.count(),
        prisma.userShop.count({ where: { role: 'owner' } }),
        prisma.userShop.count({ where: { role: 'superadmin' } })
    ]);

    // We consider it initialized if there's at least one shop and one owner.
    const hasShops = shopCount > 0;
    const hasOwner = userShopCount > 0;
    const hasSuperAdmin = superAdminCount > 0;

    return {
        hasShops,
        hasSuperAdmin,
        isInitialized: (hasShops && hasOwner) || hasSuperAdmin
    };
}
