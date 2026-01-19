import { requireUser } from '../../auth/server';
import type { TenantRole } from '../../auth/types';

export interface SettingsAdminContext {
  userId: string;
  userEmail?: string;
  role: TenantRole;
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

  return {
    userId: auth.id,
    userEmail: auth.email,
    role
  };
}

export function assertOwnerRole(role: TenantRole) {
  if (role !== 'owner') {
    throw forbidden('Aktion erfordert Owner-Rechte.');
  }
}
