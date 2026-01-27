import { requireUser } from '../../auth/server';
import type { TenantRole } from '../../auth/types';
import { prisma } from '../../prisma';

export interface SettingsAdminContext {
  userId: string;
  userEmail?: string;
  role: TenantRole;
  shopId: string;
}

function forbidden(message: string) {
  const error = new Error(message);
  (error as Error & { status?: number }).status = 403;
  return error;
}

export async function requireSettingsAdmin(request: Request): Promise<SettingsAdminContext> {
  const auth = await requireUser(request);
  const role = auth.role;

  if (role !== 'superadmin' && role !== 'owner' && role !== 'manager') {
    throw forbidden('Unzureichende Berechtigungen für Einstellungen.');
  }

  // Resolve the user's shop
  let shopId: string | null = null;

  // 1. Try to find a direct assignment
  const userShop = await prisma.userShop.findFirst({
    where: {
      userId: auth.id,
      status: 'active'
    }
  });

  if (userShop) {
    shopId = userShop.shopId;
  } else if (role === 'superadmin') {
    // 2. SuperAdmins (IT Support) can manage any shop. 
    // For now, we auto-resolve to the first shop in the system.
    const firstShop = await prisma.shop.findFirst();
    if (firstShop) {
      shopId = firstShop.id;
    }
  }

  if (!shopId) {
    throw forbidden('Kein Geschäft gefunden. Benutzer ist keinem Geschäft zugeordnet.');
  }

  return {
    userId: auth.id,
    userEmail: auth.email,
    role,
    shopId
  };
}

export function assertOwnerRole(role: TenantRole) {
  if (role !== 'superadmin' && role !== 'owner') {
    throw forbidden('Aktion erfordert Owner-Rechte.');
  }
}
