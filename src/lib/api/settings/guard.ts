import { requireUser } from '../../auth/server';
import { getUserShopIdOrThrow, getUserTenantRoleOrThrow, type TenantRole } from '../../tenant';

export interface SettingsAdminContext {
  userId: string;
  userEmail?: string;
  shopId: string;
  role: TenantRole;
}

function forbidden(message: string) {
  const error = new Error(message);
  (error as Error & { status?: number }).status = 403;
  return error;
}

export async function requireSettingsAdmin(request: Request): Promise<SettingsAdminContext> {
  const auth = await requireUser(request);
  const shopId = await getUserShopIdOrThrow(auth.id);
  const role = await getUserTenantRoleOrThrow(auth.id);

  if (role !== 'owner' && role !== 'manager') {
    throw forbidden('Unzureichende Berechtigungen für Einstellungen.');
  }

  return {
    userId: auth.id,
    userEmail: auth.email,
    shopId,
    role
  };
}

export function assertOwnerRole(role: TenantRole) {
  if (role !== 'owner') {
    throw forbidden('Aktion erfordert Owner-Rechte.');
  }
}
