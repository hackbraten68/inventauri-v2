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

  if (role !== 'owner' && role !== 'manager') {
    throw forbidden('Unzureichende Berechtigungen für Einstellungen.');
  }

  // Resolve the user's shop - for now we'll take the first shop they have access to
  // In a multi-shop scenario, this might need to be enhanced to handle shop selection
  const userShop = await prisma.userShop.findFirst({
    where: {
      userId: auth.id,
      status: 'active'
    },
    include: {
      shop: true
    }
  });

  if (!userShop) {
    throw forbidden('Kein Geschäft gefunden. Benutzer ist keinem Geschäft zugeordnet.');
  }

  return {
    userId: auth.id,
    userEmail: auth.email,
    role,
    shopId: userShop.shopId
  };
}

export function assertOwnerRole(role: TenantRole) {
  if (role !== 'owner') {
    throw forbidden('Aktion erfordert Owner-Rechte.');
  }
}
