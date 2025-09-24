import { prisma } from './prisma';

export type TenantRole = 'owner' | 'manager' | 'staff';

/**
 * Resolve the user's primary shop. If multiple mappings exist, returns the most recent one.
 * Throws a 403-style error object if no mapping exists.
 */
export async function getUserShopIdOrThrow(userId: string): Promise<string> {
  const mapping = await prisma.userShop.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  if (!mapping) {
    const err = new Error('Kein Shop für diesen Benutzer zugeordnet');
    (err as any).status = 403;
    throw err;
  }
  return mapping.shopId;
}

/**
 * Returns the user's role within their most recent shop mapping.
 * Throws if no mapping exists.
 */
export async function getUserTenantRoleOrThrow(userId: string): Promise<TenantRole> {
  const mapping = await prisma.userShop.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { role: true }
  });
  if (!mapping) {
    const err = new Error('Kein Shop für diesen Benutzer zugeordnet');
    (err as any).status = 403;
    throw err;
  }
  // Trust values are validated at write-time; cast to known union for convenience
  return mapping.role as TenantRole;
}

/**
 * Ensure the given user belongs to the provided shop. Throws 403 if not.
 */
export async function assertUserInShop(userId: string, shopId: string): Promise<void> {
  const exists = await prisma.userShop.findFirst({ where: { userId, shopId } });
  if (!exists) {
    const err = new Error('Unzureichende Berechtigungen für diesen Shop');
    (err as any).status = 403;
    throw err;
  }
}
